import { ProgressBarManager } from '../client/public/js/modules/progressBar';
import { Workflow } from '@shared/types/Workflow';
import { ProgressMessage } from '@shared/types/WebSocket';

describe('ProgressBarManager', () => {
  let progressBarManager: ProgressBarManager;
  let mockCurrentInnerElem: HTMLElement;
  let mockCurrentTextElem: HTMLElement;
  let mockCurrentLabelElem: HTMLElement;
  let mockTotalInnerElem: HTMLElement;
  let mockTotalTextElem: HTMLElement;

  beforeEach(() => {
    // Create fresh mock DOM elements for each test
    mockCurrentInnerElem = document.createElement('div');
    mockCurrentTextElem = document.createElement('div');
    mockCurrentLabelElem = document.createElement('div');
    mockTotalInnerElem = document.createElement('div');
    mockTotalTextElem = document.createElement('div');

    // Mock document.querySelector to return our mock elements
    document.querySelector = jest.fn((selector: string) => {
      switch (selector) {
        case '.current-image-progress .progress-bar-inner':
          return mockCurrentInnerElem;
        case '.current-image-progress .progress-bar-text':
          return mockCurrentTextElem;
        case '.current-image-progress-label':
          return mockCurrentLabelElem;
        case '.total-images-progress .progress-bar-inner':
          return mockTotalInnerElem;
        case '.total-images-progress .progress-bar-text':
          return mockTotalTextElem;
        default:
          return null;
      }
    });

    progressBarManager = new ProgressBarManager();
    
    // Enable synchronous mode for testing
    progressBarManager.setSynchronousMode(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct DOM elements', () => {
      expect(progressBarManager['elements'].current.innerElem).toBe(mockCurrentInnerElem);
      expect(progressBarManager['elements'].current.textElem).toBe(mockCurrentTextElem);
      expect(progressBarManager['elements'].current.labelElem).toBe(mockCurrentLabelElem);
      expect(progressBarManager['elements'].total.innerElem).toBe(mockTotalInnerElem);
      expect(progressBarManager['elements'].total.textElem).toBe(mockTotalTextElem);
    });

    it('should initialize with default state values', () => {
      expect(progressBarManager['workflow']).toBeNull();
      expect(progressBarManager['totalNodes']).toBe(0);
      expect(progressBarManager['completedNodes'].size).toBe(0);
      expect(progressBarManager['currentNodeProgress']).toBe(0);
      expect(progressBarManager['currentNodeMax']).toBe(1);
    });
  });

  describe('initializeWithWorkflow', () => {
    it('should initialize with workflow data', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'VAEDecode', inputs: {}, _meta: { title: 'VAEDecode' } }
      };

      progressBarManager.initializeWithWorkflow(mockWorkflow);

      expect(progressBarManager['workflow']).toBe(mockWorkflow);
      expect(progressBarManager['totalNodes']).toBe(3);
      expect(progressBarManager['completedNodes'].size).toBe(0);
      expect(progressBarManager['currentNodeProgress']).toBe(0);
      expect(progressBarManager['currentNodeMax']).toBe(1);
    });

    it('should handle empty workflow', () => {
      const emptyWorkflow: Workflow = {};

      progressBarManager.initializeWithWorkflow(emptyWorkflow);

      expect(progressBarManager['workflow']).toBe(emptyWorkflow);
      expect(progressBarManager['totalNodes']).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset all progress bars to 0%', () => {
      // Set some initial state
      progressBarManager['workflow'] = { '1': { class_type: 'Test', inputs: {}, _meta: { title: 'Test' } } };
      progressBarManager['totalNodes'] = 1;
      progressBarManager['completedNodes'].add('1');
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;

      progressBarManager.reset();

      expect(mockCurrentTextElem.textContent).toBe('0%');
      expect(mockCurrentInnerElem.style.width).toBe('0%');
      expect(mockTotalTextElem.textContent).toBe('0%');
      expect(mockTotalInnerElem.style.width).toBe('0%');
    });

    it('should reset all internal state variables', () => {
      // Set some initial state
      progressBarManager['workflow'] = { '1': { class_type: 'Test', inputs: {}, _meta: { title: 'Test' } } };
      progressBarManager['totalNodes'] = 5;
      progressBarManager['completedNodes'].add('1');
      progressBarManager['completedNodes'].add('2');
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;

      progressBarManager.reset();

      expect(progressBarManager['workflow']).toBeNull();
      expect(progressBarManager['totalNodes']).toBe(0);
      expect(progressBarManager['completedNodes'].size).toBe(0);
      expect(progressBarManager['currentNodeProgress']).toBe(0);
      expect(progressBarManager['currentNodeMax']).toBe(1);
    });
  });

  describe('setProgressBar', () => {
    it('should update current progress bar correctly', () => {
      progressBarManager.setProgressBar('current', '75%');

      expect(mockCurrentTextElem.textContent).toBe('75%');
      expect(mockCurrentInnerElem.style.width).toBe('75%');
    });

    it('should update total progress bar correctly', () => {
      progressBarManager.setProgressBar('total', '50%');

      expect(mockTotalTextElem.textContent).toBe('50%');
      expect(mockTotalInnerElem.style.width).toBe('50%');
    });
  });

  describe('updateProgressBars', () => {
    beforeEach(() => {
      // Initialize with a workflow
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } }
      };
      progressBarManager.initializeWithWorkflow(mockWorkflow);
    });

    it('should update current node progress correctly', () => {
      const progressMessage: ProgressMessage = {
        value: 50,
        max: 100
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(progressBarManager['currentNodeProgress']).toBe(50);
      expect(progressBarManager['currentNodeMax']).toBe(100);
      expect(mockCurrentTextElem.textContent).toBe('50%');
      expect(mockCurrentInnerElem.style.width).toBe('50%');
    });

    it('should handle zero max value', () => {
      const progressMessage: ProgressMessage = {
        value: 0,
        max: 0
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(mockCurrentTextElem.textContent).toBe('0%');
      expect(mockCurrentInnerElem.style.width).toBe('0%');
    });

    it('should add current node to completed set when complete', () => {
      const progressMessage: ProgressMessage = {
        value: 100,
        max: 100,
        node: '1'
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(progressBarManager['completedNodes'].has('1')).toBe(true);
    });

    it('should not add current node to completed set when not complete', () => {
      const progressMessage: ProgressMessage = {
        value: 50,
        max: 100,
        node: '1'
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(progressBarManager['completedNodes'].has('1')).toBe(false);
    });

    it('should not add current node to completed set when max is zero', () => {
      const progressMessage: ProgressMessage = {
        value: 0,
        max: 0,
        node: '1'
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(progressBarManager['completedNodes'].has('1')).toBe(false);
    });
  });

  describe('updateTotalProgress', () => {
    it('should calculate total progress correctly with completed nodes', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'VAEDecode', inputs: {}, _meta: { title: 'VAEDecode' } }
      };
      progressBarManager.initializeWithWorkflow(mockWorkflow);

      // Add nodes 1 and 2 to completed set
      progressBarManager['completedNodes'].add('1');
      progressBarManager['completedNodes'].add('2');

      progressBarManager['updateTotalProgress']();

      // Should be 2/3 = 66.67% rounded to 67%
      expect(mockTotalTextElem.textContent).toBe('67%');
      expect(mockTotalInnerElem.style.width).toBe('67%');
    });

    it('should handle zero total nodes', () => {
      progressBarManager['totalNodes'] = 0;

      progressBarManager['updateTotalProgress']();

      // Should not update anything when total nodes is 0 (returns early)
      expect(mockTotalTextElem.textContent).toBe('');
      expect(mockTotalInnerElem.style.width).toBe('');
    });

    it('should cap total progress at 100%', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      progressBarManager.initializeWithWorkflow(mockWorkflow);

      // Add node 1 to completed set
      progressBarManager['completedNodes'].add('1');

      progressBarManager['updateTotalProgress']();

      // Should be 100%
      expect(mockTotalTextElem.textContent).toBe('100%');
      expect(mockTotalInnerElem.style.width).toBe('100%');
    });
  });

  describe('complete', () => {
    it('should set both progress bars to 100%', () => {
      progressBarManager.complete();

      expect(mockCurrentTextElem.textContent).toBe('100%');
      expect(mockCurrentInnerElem.style.width).toBe('100%');
      expect(mockTotalTextElem.textContent).toBe('100%');
      expect(mockTotalInnerElem.style.width).toBe('100%');
    });
  });

  describe('getter methods', () => {
    beforeEach(() => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } }
      };
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      progressBarManager['completedNodes'].add('1');
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;
    });

    it('should return correct total node count', () => {
      expect(progressBarManager.getTotalNodeCount()).toBe(2);
    });

    it('should return correct completed node count', () => {
      expect(progressBarManager.getCompletedNodeCount()).toBe(1);
    });

    it('should return correct current node progress', () => {
      expect(progressBarManager.getCurrentNodeProgress()).toBe(50);
    });

    it('should return correct current node max value', () => {
      expect(progressBarManager.getCurrentNodeMax()).toBe(100);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete workflow generation cycle', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'VAEDecode', inputs: {}, _meta: { title: 'VAEDecode' } }
      };

      // Initialize
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      expect(progressBarManager.getTotalNodeCount()).toBe(3);
      expect(progressBarManager.getCompletedNodeCount()).toBe(0);

      // First node progress
      progressBarManager.updateProgressBars({ value: 50, max: 100, node: '1' });
      expect(progressBarManager.getCurrentNodeProgress()).toBe(50);
      expect(progressBarManager.getCompletedNodeCount()).toBe(0);

      // First node complete
      progressBarManager.updateProgressBars({ value: 100, max: 100, node: '1' });
      expect(progressBarManager.getCompletedNodeCount()).toBe(1);

      // Second node progress
      progressBarManager.updateProgressBars({ value: 25, max: 50, node: '2' });
      expect(progressBarManager.getCurrentNodeProgress()).toBe(25);
      expect(progressBarManager.getCompletedNodeCount()).toBe(1);

      // Second node complete
      progressBarManager.updateProgressBars({ value: 50, max: 50, node: '2' });
      expect(progressBarManager.getCompletedNodeCount()).toBe(2);

      // Third node progress
      progressBarManager.updateProgressBars({ value: 75, max: 100, node: '3' });
      expect(progressBarManager.getCurrentNodeProgress()).toBe(75);
      expect(progressBarManager.getCompletedNodeCount()).toBe(2);

      // Complete generation
      progressBarManager.complete();
      expect(mockCurrentTextElem.textContent).toBe('100%');
      expect(mockTotalTextElem.textContent).toBe('100%');
    });

    it('should handle reset and reinitialize correctly', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };

      // Initialize and make some progress
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      progressBarManager.updateProgressBars({ value: 50, max: 100, node: '1' });

      // Reset
      progressBarManager.reset();
      expect(progressBarManager.getTotalNodeCount()).toBe(0);
      expect(progressBarManager.getCompletedNodeCount()).toBe(0);
      expect(mockCurrentTextElem.textContent).toBe('0%');
      expect(mockTotalTextElem.textContent).toBe('0%');

      // Reinitialize with different workflow
      const newWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } }
      };
      progressBarManager.initializeWithWorkflow(newWorkflow);
      expect(progressBarManager.getTotalNodeCount()).toBe(2);
      expect(progressBarManager.getCompletedNodeCount()).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers correctly', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      progressBarManager.initializeWithWorkflow(mockWorkflow);

      const progressMessage: ProgressMessage = {
        value: 999999999,
        max: 1000000000,
        node: '1'
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(mockCurrentTextElem.textContent).toBe('100%');
      expect(mockCurrentInnerElem.style.width).toBe('100%');
    });

    it('should handle progress value greater than max', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      progressBarManager.initializeWithWorkflow(mockWorkflow);

      const progressMessage: ProgressMessage = {
        value: 150,
        max: 100,
        node: '1'
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(mockCurrentTextElem.textContent).toBe('150%');
      expect(mockCurrentInnerElem.style.width).toBe('150%');
    });
  });

  describe('Workflow Structure Analysis', () => {
    it('should analyze simple workflow without dependencies', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check that nodeInfoMap is populated
      expect(progressBarManager['nodeInfoMap'].size).toBe(2);
      
      // Check that no dependencies are detected
      expect(progressBarManager['nodeInfoMap'].get('1')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeInfoMap'].get('2')?.dependencies).toEqual([]);
    });

    it('should analyze complex workflow with dependencies', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } },
        '4': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['1', 2] }, _meta: { title: 'VAEDecode' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check that nodeInfoMap is populated
      expect(progressBarManager['nodeInfoMap'].size).toBe(4);
      
      // Check dependencies
      expect(progressBarManager['nodeInfoMap'].get('1')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeInfoMap'].get('2')?.dependencies).toEqual(['1']);
      expect(progressBarManager['nodeInfoMap'].get('3')?.dependencies).toEqual(['1', '2']);
      expect(progressBarManager['nodeInfoMap'].get('4')?.dependencies).toEqual(expect.arrayContaining(['1', '3']));
    });

    it('should handle workflow with multiple root nodes', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'EmptyLatentImage', inputs: {}, _meta: { title: 'EmptyLatentImage' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], latent_image: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check dependencies
      expect(progressBarManager['nodeInfoMap'].get('1')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeInfoMap'].get('2')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeInfoMap'].get('3')?.dependencies).toEqual(['1', '2']);
    });

    it('should handle invalid node references gracefully', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: { model: ['999', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Should not crash and should ignore invalid references
      expect(progressBarManager['nodeInfoMap'].get('1')?.dependencies).toEqual([]);
    });
  });

  describe('Dependency Resolution', () => {
    it('should get all dependencies including transitive ones', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Node 3 depends on 1 and 2, and 2 depends on 1
      const deps = progressBarManager['getAllDependencies']('3');
      expect(deps.has('1')).toBe(true);
      expect(deps.has('2')).toBe(true);
      expect(deps.size).toBe(2);
    });

    it('should handle circular dependencies gracefully', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'Node1', inputs: { input: ['2', 0] }, _meta: { title: 'Node1' } },
        '2': { class_type: 'Node2', inputs: { input: ['1', 0] }, _meta: { title: 'Node2' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Should not crash and should handle circular dependencies
      const deps = progressBarManager['getAllDependencies']('1');
      expect(deps.has('2')).toBe(true);
    });
  });

  describe('Progress with Dependencies', () => {
    it('should add dependencies to completed set when node starts', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Start processing node 3 (which depends on 1 and 2)
      progressBarManager.updateProgressBars({ value: 0, max: 100, node: '3' });
      
      // Dependencies should be added to completed set
      expect(progressBarManager['completedNodes'].has('1')).toBe(true);
      expect(progressBarManager['completedNodes'].has('2')).toBe(true);
      expect(progressBarManager['completedNodes'].has('3')).toBe(false); // Not complete yet
    });

    it('should add current node to completed set when finished', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Complete node 1
      progressBarManager.updateProgressBars({ value: 100, max: 100, node: '1' });
      
      // Node should be added to completed set
      expect(progressBarManager['completedNodes'].has('1')).toBe(true);
    });

    it('should handle node switching correctly', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Start with node 1
      progressBarManager.updateProgressBars({ value: 50, max: 100, node: '1' });
      expect(progressBarManager['completedNodes'].size).toBe(0); // No dependencies
      
      // Switch to node 2
      progressBarManager.updateProgressBars({ value: 0, max: 100, node: '2' });
      expect(progressBarManager['completedNodes'].has('1')).toBe(true); // Dependency added
      
      // Complete node 2
      progressBarManager.updateProgressBars({ value: 100, max: 100, node: '2' });
      expect(progressBarManager['completedNodes'].has('2')).toBe(true); // Node added
    });
  });

  describe('Node Display Names', () => {
    it('should use title when available', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'Custom Title' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      const displayName = progressBarManager['getNodeDisplayName']('1');
      expect(displayName).toBe('Custom Title');
    });

    it('should fall back to class_type when no title', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {} }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      const displayName = progressBarManager['getNodeDisplayName']('1');
      expect(displayName).toBe('KSampler');
    });

    it('should fall back to node ID when no class_type', () => {
      const mockWorkflow: Workflow = {
        '1': { inputs: {} } as any
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      const displayName = progressBarManager['getNodeDisplayName']('1');
      expect(displayName).toBe('1');
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources properly', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      progressBarManager['completedNodes'].add('1');
      
      progressBarManager.cleanup();
      
      expect(progressBarManager['workflow']).toBeNull();
      expect(progressBarManager['totalNodes']).toBe(0);
      expect(progressBarManager['completedNodes'].size).toBe(0);
      expect(progressBarManager['nodeInfoMap'].size).toBe(0);
    });
  });
}); 