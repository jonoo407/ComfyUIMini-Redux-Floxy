import { SaveInputValues, getSavedInputs, getSavedInputValue, clearSavedInputValuesForWorkflow, clearAllSavedInputValues } from '../client/public/js/modules/savedInputValues';
import { Workflow } from '@shared/types/Workflow';
import { NodeInputValues } from '@shared/types/SavedInputs';

// Mock localStorage
let localStorageMock: {
  store: { [key: string]: string };
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
};

beforeEach(() => {
  let store: { [key: string]: string } = {};
  localStorageMock = {
    store,
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
});

describe('savedInputValues', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('getSavedInputs', () => {
    it('should return empty object when localStorage is empty', () => {
      const result = getSavedInputs();
      expect(result).toEqual({});
      expect(localStorageMock.getItem).toHaveBeenCalledWith('savedInputs');
    });

    it('should return parsed object from localStorage', () => {
      const mockData = { test: { workflow1: { node1: { input1: 'value1' } } } };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = getSavedInputs();
      expect(result).toEqual(mockData);
    });

    it('should return empty object when localStorage contains invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const result = getSavedInputs();
      expect(result).toEqual({});
    });
  });

  describe('SaveInputValues.fromWorkflow', () => {
    const mockWorkflow: Workflow = {
      'node1': {
        inputs: {
          'text_input': 'hello world',
          'number_input': 42,
          'boolean_input': true,
          'array_input': ['item1', 'item2']
        },
        class_type: 'TextNode',
        _meta: { title: 'Text Node' }
      },
      'node2': {
        inputs: {
          'single_input': 'single value',
          'another_array': [1, 2, 3]
        },
        class_type: 'NumberNode',
        _meta: { title: 'Number Node' }
      }
    };

    it('should save workflow inputs to localStorage', () => {
      SaveInputValues.fromWorkflow('test_type', 'test_workflow', mockWorkflow);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'savedInputs',
        JSON.stringify({
          test_type: {
            test_workflow: {
              node1: {
                text_input: 'hello world',
                number_input: 42,
                boolean_input: true
              },
              node2: {
                single_input: 'single value'
              }
            }
          }
        })
      );
    });

    it('should skip array inputs', () => {
      SaveInputValues.fromWorkflow('test_type', 'test_workflow', mockWorkflow);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.test_type.test_workflow.node1.array_input).toBeUndefined();
      expect(savedData.test_type.test_workflow.node2.another_array).toBeUndefined();
    });

    it('should merge with existing saved inputs', () => {
      const existingData = {
        test_type: {
          existing_workflow: { node1: { input1: 'existing' } }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));

      SaveInputValues.fromWorkflow('test_type', 'test_workflow', mockWorkflow);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.test_type.existing_workflow).toEqual({ node1: { input1: 'existing' } });
      expect(savedData.test_type.test_workflow).toBeDefined();
    });

    it('should create nested structure when it does not exist', () => {
      SaveInputValues.fromWorkflow('new_type', 'new_workflow', mockWorkflow);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.new_type).toBeDefined();
      expect(savedData.new_type.new_workflow).toBeDefined();
    });
  });

  describe('SaveInputValues.fromNodeInputValues', () => {
    const mockNodeInputValues: NodeInputValues = {
      'node1': {
        'text_input': 'hello world',
        'number_input': '42'
      },
      'node2': {
        'single_input': 'single value'
      }
    };

    it('should save node input values to localStorage', () => {
      SaveInputValues.fromNodeInputValues('test_type', 'test_workflow', mockNodeInputValues);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.test_type.test_workflow.node1.text_input).toBe('hello world');
      expect(savedData.test_type.test_workflow.node1.number_input).toBe('42');
      expect(savedData.test_type.test_workflow.node2.single_input).toBe('single value');
    });

    it('should merge with existing saved inputs', () => {
      const existingData = {
        test_type: {
          existing_workflow: { node1: { input1: 'existing' } }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));

      SaveInputValues.fromNodeInputValues('test_type', 'test_workflow', mockNodeInputValues);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.test_type.existing_workflow).toEqual({ node1: { input1: 'existing' } });
      expect(savedData.test_type.test_workflow).toBeDefined();
    });

    it('should create nested structure when it does not exist', () => {
      SaveInputValues.fromNodeInputValues('new_type', 'new_workflow', mockNodeInputValues);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.new_type).toBeDefined();
      expect(savedData.new_type.new_workflow).toBeDefined();
    });
  });

  describe('getSavedInputValue', () => {
    it('should return saved input value when it exists', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: {
              text_input: 'hello world',
              number_input: 42,
              boolean_input: true
            },
            node2: {
              single_input: 'single value'
            }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = getSavedInputValue('test_type', 'test_workflow', 'node1', 'text_input');
      expect(result).toBe('hello world');
    });

    it('should return null when workflow type does not exist', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: { text_input: 'hello world' }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = getSavedInputValue('nonexistent_type', 'test_workflow', 'node1', 'text_input');
      expect(result).toBeNull();
    });

    it('should return null when workflow identifier does not exist', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: { text_input: 'hello world' }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = getSavedInputValue('test_type', 'nonexistent_workflow', 'node1', 'text_input');
      expect(result).toBeNull();
    });

    it('should return null when node does not exist', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: { text_input: 'hello world' }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = getSavedInputValue('test_type', 'test_workflow', 'nonexistent_node', 'text_input');
      expect(result).toBeNull();
    });

    it('should return null when input name does not exist', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: { text_input: 'hello world' }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = getSavedInputValue('test_type', 'test_workflow', 'node1', 'nonexistent_input');
      expect(result).toBeNull();
    });

    it('should return null when input value is undefined', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: {
              text_input: undefined
            }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = getSavedInputValue('test_type', 'test_workflow', 'node1', 'text_input');
      expect(result).toBeNull();
    });

    it('should return different types of values correctly', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: {
              text_input: 'hello world',
              number_input: 42,
              boolean_input: true
            },
            node2: {
              single_input: 'single value'
            }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      expect(getSavedInputValue('test_type', 'test_workflow', 'node1', 'number_input')).toBe(42);
      expect(getSavedInputValue('test_type', 'test_workflow', 'node1', 'boolean_input')).toBe(true);
      expect(getSavedInputValue('test_type', 'test_workflow', 'node2', 'single_input')).toBe('single value');
    });
  });

  describe('clearSavedInputValuesForWorkflow', () => {
    it('should remove specific workflow from localStorage', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: { input1: 'value1' }
          },
          other_workflow: {
            node1: { input1: 'value2' }
          }
        },
        other_type: {
          test_workflow: {
            node1: { input1: 'value3' }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      clearSavedInputValuesForWorkflow('test_type', 'test_workflow');

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.test_type.test_workflow).toBeUndefined();
      expect(savedData.test_type.other_workflow).toBeDefined();
      expect(savedData.other_type.test_workflow).toBeDefined();
    });

    it('should create workflow type if it does not exist', () => {
      clearSavedInputValuesForWorkflow('new_type', 'new_workflow');

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.new_type).toEqual({});
    });

    it('should preserve other workflows and types', () => {
      const mockData = {
        test_type: {
          test_workflow: {
            node1: { input1: 'value1' }
          },
          other_workflow: {
            node1: { input1: 'value2' }
          }
        },
        other_type: {
          test_workflow: {
            node1: { input1: 'value3' }
          }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      clearSavedInputValuesForWorkflow('test_type', 'test_workflow');

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.test_type.other_workflow).toBeDefined();
      expect(savedData.other_type).toBeDefined();
    });
  });

  describe('clearAllSavedInputValues', () => {
    it('should clear all saved inputs from localStorage', () => {
      const mockData = {
        test_type: {
          test_workflow: { node1: { input1: 'value1' } }
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      clearAllSavedInputValues();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('savedInputs', JSON.stringify({}));
    });

    it('should work when localStorage is empty', () => {
      clearAllSavedInputValues();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('savedInputs', JSON.stringify({}));
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow lifecycle', () => {
      const mockWorkflow: Workflow = {
        'node1': {
          inputs: { 'input1': 'value1', 'input2': 42 },
          class_type: 'TestNode',
          _meta: { title: 'Test Node' }
        }
      };

      // Save workflow
      SaveInputValues.fromWorkflow('test_type', 'test_workflow', mockWorkflow);
      
      // Verify saved
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.test_type.test_workflow.node1.input1).toBe('value1');
      expect(savedData.test_type.test_workflow.node1.input2).toBe(42);

      // Get saved value
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));
      const retrievedValue = getSavedInputValue('test_type', 'test_workflow', 'node1', 'input1');
      expect(retrievedValue).toBe('value1');

      // Clear specific workflow
      clearSavedInputValuesForWorkflow('test_type', 'test_workflow');
      const clearedData = JSON.parse(localStorageMock.setItem.mock.calls[1][1]);
      expect(clearedData.test_type.test_workflow).toBeUndefined();

      // Clear all
      clearAllSavedInputValues();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('savedInputs', JSON.stringify({}));
    });

    it('should handle multiple workflow types and identifiers', () => {
      const workflow1: Workflow = {
        'node1': {
          inputs: { 'input1': 'value1' },
          class_type: 'TestNode',
          _meta: { title: 'Test Node' }
        }
      };

      const workflow2: Workflow = {
        'node2': {
          inputs: { 'input2': 'value2' },
          class_type: 'TestNode',
          _meta: { title: 'Test Node' }
        }
      };

      // Save multiple workflows
      SaveInputValues.fromWorkflow('type1', 'workflow1', workflow1);
      SaveInputValues.fromWorkflow('type1', 'workflow2', workflow2);
      SaveInputValues.fromWorkflow('type2', 'workflow1', workflow1);

      // Check the final state after all three saves
      const finalData = JSON.parse(localStorageMock.setItem.mock.calls[2][1]);
      expect(finalData.type1.workflow1).toBeDefined();
      expect(finalData.type1.workflow2).toBeDefined();
      expect(finalData.type2.workflow1).toBeDefined();
    });
  });
}); 