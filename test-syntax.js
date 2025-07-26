// Test file with syntax errors for demonstration
var testFunction = function () {
    var message = "Hello World";
    console.log(mesage); // Typo: should be 'message'
    var number = "123"; // Type error: string assigned to number
    if (true) {
        console.log("Missing closing brace");
        // Missing closing brace
        return undefinedVariable; // Reference error: undefined variable
    }
};
