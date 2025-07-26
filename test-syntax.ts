// Test file with syntax errors for demonstration
const testFunction = () => {
    const message: string = "Hello World"
    console.log(mesage); // Typo: should be 'message'
    
    const number: number = "123"; // Type error: string assigned to number
    
    if (true) {
        console.log("Now with closing brace");
    } // Fixed: added closing brace
    
    return undefinedVariable; // Reference error: undefined variable
}