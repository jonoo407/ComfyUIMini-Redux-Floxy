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
      expect(mockTotalTextElem.textContent).toBe('75%');
      expect(mockTotalInnerElem.style.width).toBe('75%');
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
}); 