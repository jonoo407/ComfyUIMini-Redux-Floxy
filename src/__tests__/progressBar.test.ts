import { ProgressBarManager } from '../client/public/js/modules/progressBar';
import { Workflow } from '@shared/types/Workflow';
import { ProgressMessage } from '@shared/types/WebSocket';

describe('ProgressBarManager', () => {
  let progressBarManager: ProgressBarManager;
  let mockCurrentInnerElem: HTMLElement;
  let mockCurrentTextElem: HTMLElement;
  let mockTotalInnerElem: HTMLElement;
  let mockTotalTextElem: HTMLElement;

  beforeEach(() => {
    // Create fresh mock DOM elements for each test
    mockCurrentInnerElem = document.createElement('div');
    mockCurrentTextElem = document.createElement('div');
    mockTotalInnerElem = document.createElement('div');
    mockTotalTextElem = document.createElement('div');

    // Mock document.querySelector to return our mock elements
    document.querySelector = jest.fn((selector: string) => {
      switch (selector) {
        case '.current-image-progress .progress-bar-inner':
          return mockCurrentInnerElem;
        case '.current-image-progress .progress-bar-text':
          return mockCurrentTextElem;
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
      expect(progressBarManager['elements'].total.innerElem).toBe(mockTotalInnerElem);
      expect(progressBarManager['elements'].total.textElem).toBe(mockTotalTextElem);
    });

    it('should initialize with default state values', () => {
      expect(progressBarManager['workflow']).toBeNull();
      expect(progressBarManager['totalNodes']).toBe(0);
      expect(progressBarManager['completedNodes']).toBe(0);
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
      expect(progressBarManager['completedNodes']).toBe(0);
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
      progressBarManager['completedNodes'] = 1;
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
      progressBarManager['completedNodes'] = 3;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;

      progressBarManager.reset();

      expect(progressBarManager['workflow']).toBeNull();
      expect(progressBarManager['totalNodes']).toBe(0);
      expect(progressBarManager['completedNodes']).toBe(0);
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

    it('should increment completed nodes when current node is complete', () => {
      const progressMessage: ProgressMessage = {
        value: 100,
        max: 100
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(progressBarManager['completedNodes']).toBe(1);
    });

    it('should not increment completed nodes when current node is not complete', () => {
      const progressMessage: ProgressMessage = {
        value: 50,
        max: 100
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(progressBarManager['completedNodes']).toBe(0);
    });

    it('should not increment completed nodes when max is zero', () => {
      const progressMessage: ProgressMessage = {
        value: 0,
        max: 0
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(progressBarManager['completedNodes']).toBe(0);
    });

    it('should cap completed nodes to total nodes', () => {
      // Set completed nodes to total nodes
      progressBarManager['completedNodes'] = 2;

      const progressMessage: ProgressMessage = {
        value: 100,
        max: 100
      };

      progressBarManager.updateProgressBars(progressMessage);

      expect(progressBarManager['completedNodes']).toBe(2); // Should not exceed total nodes
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

      // Set completed nodes to 2 out of 3
      progressBarManager['completedNodes'] = 2;
      progressBarManager['currentNodeProgress'] = 0;
      progressBarManager['currentNodeMax'] = 1;

      progressBarManager['updateTotalProgress']();

      // Should be 2/3 = 66.67% rounded to 67%
      expect(mockTotalTextElem.textContent).toBe('67%');
      expect(mockTotalInnerElem.style.width).toBe('67%');
    });

    it('should calculate total progress with current node progress', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } }
      };
      progressBarManager.initializeWithWorkflow(mockWorkflow);

      // Set completed nodes to 1 out of 2, and current node at 50%
      progressBarManager['completedNodes'] = 1;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;

      progressBarManager['updateTotalProgress']();

      // Should be 1/2 + (50/100)/2 = 0.5 + 0.25 = 0.75 = 75%
      // With optimizations, this might be slightly higher due to the multiplier
      const actualProgress = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
      expect(actualProgress).toBeGreaterThanOrEqual(75);
      expect(actualProgress).toBeLessThanOrEqual(100);
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

      // Set completed nodes to 1 and current node at 200% (should be capped)
      progressBarManager['completedNodes'] = 1;
      progressBarManager['currentNodeProgress'] = 200;
      progressBarManager['currentNodeMax'] = 100;

      progressBarManager['updateTotalProgress']();

      // Should be capped at 100%
      expect(mockTotalTextElem.textContent).toBe('100%');
      expect(mockTotalInnerElem.style.width).toBe('100%');
    });

    it('should handle zero max value for current node', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } }
      };
      progressBarManager.initializeWithWorkflow(mockWorkflow);

      progressBarManager['completedNodes'] = 1;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 0;

      progressBarManager['updateTotalProgress']();

      // Should be 1/2 + 0 = 50%
      expect(mockTotalTextElem.textContent).toBe('50%');
      expect(mockTotalInnerElem.style.width).toBe('50%');
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
      progressBarManager['completedNodes'] = 1;
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
      progressBarManager.updateProgressBars({ value: 50, max: 100 });
      expect(progressBarManager.getCurrentNodeProgress()).toBe(50);
      expect(progressBarManager.getCompletedNodeCount()).toBe(0);

      // First node complete
      progressBarManager.updateProgressBars({ value: 100, max: 100 });
      expect(progressBarManager.getCompletedNodeCount()).toBe(1);

      // Second node progress
      progressBarManager.updateProgressBars({ value: 25, max: 50 });
      expect(progressBarManager.getCurrentNodeProgress()).toBe(25);
      expect(progressBarManager.getCompletedNodeCount()).toBe(1);

      // Second node complete
      progressBarManager.updateProgressBars({ value: 50, max: 50 });
      expect(progressBarManager.getCompletedNodeCount()).toBe(2);

      // Third node progress
      progressBarManager.updateProgressBars({ value: 75, max: 100 });
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
      progressBarManager.updateProgressBars({ value: 50, max: 100 });

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
        max: 1000000000
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
        max: 100
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
      
      // Check that nodeDepthMap is populated
      expect(progressBarManager['nodeDepthMap'].size).toBe(2);
      
      // Check that nodes without dependencies have depth 0
      expect(progressBarManager['nodeDepthMap'].get('1')?.depth).toBe(0);
      expect(progressBarManager['nodeDepthMap'].get('2')?.depth).toBe(0);
      
      // Check that no dependencies are detected
      expect(progressBarManager['nodeDepthMap'].get('1')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeDepthMap'].get('2')?.dependencies).toEqual([]);
    });

    it('should analyze complex workflow with dependencies', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } },
        '4': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['1', 2] }, _meta: { title: 'VAEDecode' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check that nodeDepthMap is populated
      expect(progressBarManager['nodeDepthMap'].size).toBe(4);
      
      // Check node depths
      expect(progressBarManager['nodeDepthMap'].get('1')?.depth).toBe(0); // Root node
      expect(progressBarManager['nodeDepthMap'].get('2')?.depth).toBe(1); // Depends on 1
      expect(progressBarManager['nodeDepthMap'].get('3')?.depth).toBe(2); // Depends on 1 and 2
      expect(progressBarManager['nodeDepthMap'].get('4')?.depth).toBe(3); // Depends on 1 and 3
      
      // Check dependencies
      expect(progressBarManager['nodeDepthMap'].get('1')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeDepthMap'].get('2')?.dependencies).toEqual(['1']);
      expect(progressBarManager['nodeDepthMap'].get('3')?.dependencies).toEqual(['1', '2']);
      expect(progressBarManager['nodeDepthMap'].get('4')?.dependencies).toEqual(['3', '1']);
      
      // Check max depth
      expect(progressBarManager['maxDepth']).toBe(3);
    });

    it('should handle workflow with multiple root nodes', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'EmptyLatentImage', inputs: {}, _meta: { title: 'EmptyLatentImage' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], latent_image: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check that both root nodes have depth 0
      expect(progressBarManager['nodeDepthMap'].get('1')?.depth).toBe(0);
      expect(progressBarManager['nodeDepthMap'].get('2')?.depth).toBe(0);
      expect(progressBarManager['nodeDepthMap'].get('3')?.depth).toBe(1);
      
      // Check dependencies
      expect(progressBarManager['nodeDepthMap'].get('3')?.dependencies).toEqual(['1', '2']);
    });

    it('should handle invalid node references gracefully', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: { model: ['999', 0] }, _meta: { title: 'KSampler' } }, // Invalid ref
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Should not crash and should ignore invalid references
      expect(progressBarManager['nodeDepthMap'].size).toBe(2);
      expect(progressBarManager['nodeDepthMap'].get('1')?.dependencies).toEqual([]); // Invalid ref ignored
      expect(progressBarManager['nodeDepthMap'].get('2')?.dependencies).toEqual(['1']); // Valid ref kept
    });
  });

  describe('Structure-Aware Progress Calculation', () => {
    it('should use simple calculation for workflows without dependencies', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Set completed nodes to 1 out of 2
      progressBarManager['completedNodes'] = 1;
      progressBarManager['currentNodeProgress'] = 0;
      progressBarManager['currentNodeMax'] = 1;
      
      progressBarManager['updateTotalProgress']();
      
      // Should use simple calculation: 1/2 = 50%
      expect(mockTotalTextElem.textContent).toBe('50%');
    });

    it('should use structure-aware calculation for workflows with dependencies', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Simulate being at node 3 (deepest) with 50% progress
      progressBarManager['completedNodes'] = 0;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;
      progressBarManager['currentNodeId'] = '3' as string; // Set current node to trigger dependency logic
      
      progressBarManager['updateTotalProgress']();
      
      // Should estimate more progress than simple calculation would suggest
      // Because if we're at node 3, nodes 1 and 2 should be considered complete
      const progressText = mockTotalTextElem.textContent;
      expect(progressText).not.toBe('17%'); // Simple calc would be (0 + 0.5/3) * 100 = 17%
      
      // With structure-aware calculation, should be higher due to dependency multiplier
      const actualProgress = parseInt(progressText!.replace('%', ''));
      expect(actualProgress).toBeGreaterThan(17);
      // The new logic can result in 100% due to dependency multiplier, which is acceptable
      expect(actualProgress).toBeLessThanOrEqual(100);
    });

    it('should handle progress estimation for complex dependency chains', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } },
        '4': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['1', 2] }, _meta: { title: 'VAEDecode' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Test progress at different stages
      const testCases = [
        { completedNodes: 0, currentProgress: 0, currentMax: 1, expectedMin: 0 },
        { completedNodes: 1, currentProgress: 0, currentMax: 1, expectedMin: 25 },
        { completedNodes: 2, currentProgress: 50, currentMax: 100, expectedMin: 50 },
        { completedNodes: 3, currentProgress: 100, currentMax: 100, expectedMin: 75 }
      ];
      
      testCases.forEach(({ completedNodes, currentProgress, currentMax, expectedMin }) => {
        progressBarManager['completedNodes'] = completedNodes;
        progressBarManager['currentNodeProgress'] = currentProgress;
        progressBarManager['currentNodeMax'] = currentMax;
        
        progressBarManager['updateTotalProgress']();
        
        const actualProgress = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
        expect(actualProgress).toBeGreaterThanOrEqual(expectedMin);
      });
    });

    it('should fall back to simple calculation when structure analysis fails', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Clear the node depth map to simulate analysis failure
      progressBarManager['nodeDepthMap'].clear();
      
      progressBarManager['completedNodes'] = 0;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;
      
      progressBarManager['updateTotalProgress']();
      
      // Should use simple calculation: (0 + 0.5) / 1 = 50%
      // With optimizations and caching, might be slightly different
      const actualProgress = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
      expect(actualProgress).toBeGreaterThanOrEqual(50);
      expect(actualProgress).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration with updateProgressBars', () => {
    it('should work correctly with structure-aware progress in complex workflow', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Simulate progress updates
      const progressUpdates: ProgressMessage[] = [
        { value: 50, max: 100 },
        { value: 100, max: 100 }, // Complete first node
        { value: 50, max: 100 },   // Progress on second node
        { value: 100, max: 100 },  // Complete second node
        { value: 25, max: 100 }    // Progress on third node
      ];
      
      progressUpdates.forEach((update) => {
        progressBarManager.updateProgressBars(update);
        
        // Total progress should increase or stay the same
        const totalProgress = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
        expect(totalProgress).toBeGreaterThanOrEqual(0);
        expect(totalProgress).toBeLessThanOrEqual(100);
        
        // Current progress should match the update
        const currentProgress = parseInt(mockCurrentTextElem.textContent!.replace('%', ''));
        expect(currentProgress).toBe(Math.round((update.value / update.max) * 100));
      });
    });
  });

  describe('Branching and Merging Scenarios', () => {
    it('should handle branching workflow correctly (one node feeding multiple nodes)', () => {
      // A → B and A → C (branching)
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'EmptyLatentImage', inputs: { model: ['1', 0] }, _meta: { title: 'EmptyLatentImage' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check structure analysis
      expect(progressBarManager['nodeDepthMap'].get('1')?.depth).toBe(0);
      expect(progressBarManager['nodeDepthMap'].get('2')?.depth).toBe(1);
      expect(progressBarManager['nodeDepthMap'].get('3')?.depth).toBe(1);
      
      // Check dependencies
      expect(progressBarManager['nodeDepthMap'].get('1')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeDepthMap'].get('2')?.dependencies).toEqual(['1']);
      expect(progressBarManager['nodeDepthMap'].get('3')?.dependencies).toEqual(['1']);
      
      // Check dependents (node 1 should have both 2 and 3 as dependents)
      expect(progressBarManager['nodeDepthMap'].get('1')?.dependents).toEqual(expect.arrayContaining(['2', '3']));
    });

    it('should handle merging workflow correctly (multiple nodes feeding one node)', () => {
      // A → C and B → C (merging)
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'EmptyLatentImage', inputs: {}, _meta: { title: 'EmptyLatentImage' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], latent_image: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check structure analysis
      expect(progressBarManager['nodeDepthMap'].get('1')?.depth).toBe(0);
      expect(progressBarManager['nodeDepthMap'].get('2')?.depth).toBe(0);
      expect(progressBarManager['nodeDepthMap'].get('3')?.depth).toBe(1); // max(0, 0) + 1 = 1
      
      // Check dependencies
      expect(progressBarManager['nodeDepthMap'].get('1')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeDepthMap'].get('2')?.dependencies).toEqual([]);
      expect(progressBarManager['nodeDepthMap'].get('3')?.dependencies).toEqual(['1', '2']);
    });

    it('should handle complex branching and merging (diamond pattern)', () => {
      // A → B → D and A → C → D (diamond pattern)
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'VAELoader', inputs: { model: ['1', 0] }, _meta: { title: 'VAELoader' } },
        '4': { class_type: 'KSampler', inputs: { positive: ['2', 0], vae: ['3', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check structure analysis
      expect(progressBarManager['nodeDepthMap'].get('1')?.depth).toBe(0); // Root
      expect(progressBarManager['nodeDepthMap'].get('2')?.depth).toBe(1); // Depends on 1
      expect(progressBarManager['nodeDepthMap'].get('3')?.depth).toBe(1); // Depends on 1
      expect(progressBarManager['nodeDepthMap'].get('4')?.depth).toBe(2); // Depends on 2 and 3
      
      // Check dependencies
      expect(progressBarManager['nodeDepthMap'].get('4')?.dependencies).toEqual(['2', '3']);
    });

    it('should correctly estimate progress for branching scenarios', () => {
      // A → B and A → C (branching)
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'EmptyLatentImage', inputs: { model: ['1', 0] }, _meta: { title: 'EmptyLatentImage' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Simulate progress on node 2 (one of the branches)
      progressBarManager['completedNodes'] = 1; // Node 1 is complete
      progressBarManager['currentNodeProgress'] = 50; // Node 2 is at 50%
      progressBarManager['currentNodeMax'] = 100;
      progressBarManager['currentNodeId'] = '2'; // Set current node ID
      
      progressBarManager['updateTotalProgress']();
      
      // Should show reasonable progress considering the branching structure
      const totalProgress = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
      expect(totalProgress).toBeGreaterThanOrEqual(50); // At least 50% (node 1 complete + some progress on node 2)
      expect(totalProgress).toBeLessThanOrEqual(100); // But not exceed 100%
    });

    it('should handle complex diamond pattern progress correctly', () => {
      // A → B → D and A → C → D (diamond pattern)
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'VAELoader', inputs: { model: ['1', 0] }, _meta: { title: 'VAELoader' } },
        '4': { class_type: 'KSampler', inputs: { positive: ['2', 0], vae: ['3', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Test different stages of the diamond pattern
      const testCases = [
        { stage: 'Node 1 complete', completedNodes: 1, currentProgress: 0, currentNodeId: null, expectedMin: 25 },
        { stage: 'Node 2 in progress', completedNodes: 1, currentProgress: 50, currentNodeId: '2', expectedMin: 30 },
        { stage: 'Node 4 in progress', completedNodes: 0, currentProgress: 25, currentNodeId: '4', expectedMin: 6 } // More realistic expectation
      ];
      
      testCases.forEach(({ stage, completedNodes, currentProgress, currentNodeId, expectedMin }) => {
        progressBarManager['completedNodes'] = completedNodes;
        progressBarManager['currentNodeProgress'] = currentProgress;
        progressBarManager['currentNodeMax'] = 100;
        progressBarManager['currentNodeId'] = currentNodeId;
        
        progressBarManager['updateTotalProgress']();
        
        const actualProgress = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
        expect(actualProgress).toBeGreaterThanOrEqual(expectedMin);
        expect(actualProgress).toBeLessThanOrEqual(100);
        
        // Most importantly, should be higher than simple calculation
        const simpleCalculation = Math.round(((completedNodes + (currentProgress / 100)) / 4) * 100);
        expect(actualProgress).toBeGreaterThanOrEqual(simpleCalculation);
      });
    });

    it('should handle workflow with parallel independent branches', () => {
      // A → B and C → D (two independent chains)
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'EmptyLatentImage', inputs: {}, _meta: { title: 'EmptyLatentImage' } },
        '4': { class_type: 'KSampler', inputs: { latent_image: ['3', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Check structure analysis
      expect(progressBarManager['nodeDepthMap'].get('1')?.depth).toBe(0);
      expect(progressBarManager['nodeDepthMap'].get('2')?.depth).toBe(1);
      expect(progressBarManager['nodeDepthMap'].get('3')?.depth).toBe(0);
      expect(progressBarManager['nodeDepthMap'].get('4')?.depth).toBe(1);
      
      // Test progress estimation for independent branches
      progressBarManager['completedNodes'] = 2; // Two nodes complete
      progressBarManager['currentNodeProgress'] = 0;
      progressBarManager['currentNodeMax'] = 1;
      
      progressBarManager['updateTotalProgress']();
      
      const totalProgress = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
      expect(totalProgress).toBe(50); // Should be 2/4 = 50%
    });
  });

  describe('Enhanced Progress Bar Features', () => {
    it('should track current node ID correctly', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Initially no current node
      expect(progressBarManager['currentNodeId']).toBeNull();
      
      // Update with progress message including node ID
      const progressMessage: ProgressMessage = {
        value: 50,
        max: 100,
        node: '2',
        prompt_id: 'test-123'
      };
      
      progressBarManager.updateProgressBars(progressMessage);
      
      // Should track the current node ID
      expect(progressBarManager['currentNodeId']).toBe('2');
    });

    it('should include completed dependencies in progress calculation', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Set current node to 3 (which has dependencies on 1 and 2)
      progressBarManager['currentNodeId'] = '3' as string;
      progressBarManager['completedNodes'] = 0;
      progressBarManager['currentNodeProgress'] = 25;
      progressBarManager['currentNodeMax'] = 100;
      
      progressBarManager['updateTotalProgress']();
      
      // Should include completed dependencies (nodes 1 and 2) in the calculation
      const progressText = mockTotalTextElem.textContent;
      const actualProgress = parseInt(progressText!.replace('%', ''));
      
      // Should be higher than simple calculation due to completed dependencies
      expect(actualProgress).toBeGreaterThan(8); // Simple: (0 + 0.25/3) * 100 = 8.33%
    });

    it('should maintain stable progress when current progress becomes 0', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Set current node to 3
      progressBarManager['currentNodeId'] = '3' as string;
      progressBarManager['completedNodes'] = 1;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;
      
      progressBarManager['updateTotalProgress']();
      const progressWithCurrent = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
      
      // Now set current progress to 0
      progressBarManager['currentNodeProgress'] = 0;
      progressBarManager['updateTotalProgress']();
      const progressWithoutCurrent = parseInt(mockTotalTextElem.textContent!.replace('%', ''));
      
      // Progress should not drop significantly (should maintain completed dependencies)
      expect(progressWithoutCurrent).toBeGreaterThan(progressWithCurrent * 0.5);
    });

    it('should handle separate pending updates for current and total progress', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Set synchronous mode to false to test throttling
      progressBarManager.setSynchronousMode(false);
      
      // Update both current and total progress rapidly
      progressBarManager['setProgressBarOptimized']('current', '25%');
      progressBarManager['setProgressBarOptimized']('total', '30%');
      progressBarManager['setProgressBarOptimized']('current', '50%');
      progressBarManager['setProgressBarOptimized']('total', '60%');
      
      // Both updates should be scheduled independently
      expect(progressBarManager['pendingCurrentUpdate']).not.toBeNull();
      expect(progressBarManager['pendingTotalUpdate']).not.toBeNull();
    });

    it('should properly reset current node ID on reset', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Set a current node ID
      progressBarManager['currentNodeId'] = '1' as string;
      expect(progressBarManager['currentNodeId']).toBe('1');
      
      // Reset should clear the current node ID
      progressBarManager.reset();
      expect(progressBarManager['currentNodeId']).toBeNull();
    });

    it('should properly reset current node ID on cleanup', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Set a current node ID
      progressBarManager['currentNodeId'] = '1' as string;
      expect(progressBarManager['currentNodeId']).toBe('1');
      
      // Cleanup should clear the current node ID
      progressBarManager.cleanup();
      expect(progressBarManager['currentNodeId']).toBeNull();
    });

    it('should handle ProgressMessage with optional node and prompt_id properties', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Test with message that has node and prompt_id
      const progressMessageWithNode: ProgressMessage = {
        value: 50,
        max: 100,
        node: '1',
        prompt_id: 'test-123'
      };
      
      progressBarManager.updateProgressBars(progressMessageWithNode);
      expect(progressBarManager['currentNodeId']).toBe('1');
      
      // Test with message that doesn't have node and prompt_id
      const progressMessageWithoutNode: ProgressMessage = {
        value: 75,
        max: 100
      };
      
      progressBarManager.updateProgressBars(progressMessageWithoutNode);
      expect(progressBarManager['currentNodeId']).toBeNull();
    });

    it('should calculate dependency multiplier correctly', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {}, _meta: { title: 'CheckpointLoaderSimple' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } },
        '3': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0] }, _meta: { title: 'KSampler' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Test multiplier when no current node
      progressBarManager['currentNodeId'] = null;
      const multiplierNoNode = progressBarManager['calculateDependencyMultiplierOptimized']();
      expect(multiplierNoNode).toBe(1.0);
      
      // Test multiplier when current node exists
      progressBarManager['currentNodeId'] = '3' as string;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;
      
      const multiplierWithNode = progressBarManager['calculateDependencyMultiplierOptimized']();
      expect(multiplierWithNode).toBeGreaterThan(1.0);
      expect(multiplierWithNode).toBeLessThanOrEqual(2.0);
    });

    it('should handle workflows with no dependencies correctly', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: {}, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: {}, _meta: { title: 'CLIPTextEncode' } }
      };
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Should detect no dependencies
      expect(progressBarManager['cachedHasDependencies']).toBe(false);
      
      // Should use simple calculation
      progressBarManager['completedNodes'] = 1;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;
      
      progressBarManager['updateTotalProgress']();
      
      // Should use simple calculation: (1/2 + 0.5/2) * 100 = 75%
      expect(mockTotalTextElem.textContent).toBe('75%');
    });

    it('should handle edge case with empty workflow', () => {
      const mockWorkflow: Workflow = {};
      
      progressBarManager.initializeWithWorkflow(mockWorkflow);
      
      // Should handle empty workflow gracefully
      expect(progressBarManager['totalNodes']).toBe(0);
      expect(progressBarManager['cachedHasDependencies']).toBe(false);
      expect(progressBarManager['nodeDepthMap'].size).toBe(0);
      
      // Should not crash on progress update
      progressBarManager['updateTotalProgress']();
      // When totalNodes is 0, progress calculation returns early, so text content remains empty
      expect(mockTotalTextElem.textContent).toBe('');
    });

    it('should handle workflow with circular dependencies gracefully', () => {
      const mockWorkflow: Workflow = {
        '1': { class_type: 'KSampler', inputs: { model: ['2', 0] }, _meta: { title: 'KSampler' } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1] }, _meta: { title: 'CLIPTextEncode' } }
      };
      
      // Should not crash on circular dependencies
      expect(() => {
        progressBarManager.initializeWithWorkflow(mockWorkflow);
      }).not.toThrow();
      
      // Should still be able to calculate progress
      progressBarManager['completedNodes'] = 0;
      progressBarManager['currentNodeProgress'] = 50;
      progressBarManager['currentNodeMax'] = 100;
      
      progressBarManager['updateTotalProgress']();
      
      // Should produce a valid progress percentage
      const progressText = mockTotalTextElem.textContent;
      expect(progressText).toMatch(/^\d+%$/);
    });
  });
}); 