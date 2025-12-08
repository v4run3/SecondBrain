// Test script to verify input validation
// This script tests various malicious inputs to ensure they are properly rejected

const testCases = [
  {
    name: "NoSQL Injection - $ne operator",
    data: {
      name: "Test User",
      email: { "$ne": null },
      username: "testuser",
      password: "Test123!@#"
    },
    expectedError: true
  },
  {
    name: "NoSQL Injection - $gt operator",
    data: {
      name: "Test User",
      email: "test@example.com",
      username: { "$gt": "" },
      password: "Test123!@#"
    },
    expectedError: true
  },
  {
    name: "XSS Attack in name",
    data: {
      name: "<script>alert('xss')</script>",
      email: "test@example.com",
      username: "testuser",
      password: "Test123!@#"
    },
    expectedError: true
  },
  {
    name: "SQL Injection attempt",
    data: {
      name: "'; DROP TABLE users; --",
      email: "test@example.com",
      username: "testuser",
      password: "Test123!@#"
    },
    expectedError: true
  },
  {
    name: "Excessive length - name",
    data: {
      name: "a".repeat(1000),
      email: "test@example.com",
      username: "testuser",
      password: "Test123!@#"
    },
    expectedError: true
  },
  {
    name: "Invalid username characters",
    data: {
      name: "Test User",
      email: "test@example.com",
      username: "test@user!",
      password: "Test123!@#"
    },
    expectedError: true
  },
  {
    name: "Valid registration",
    data: {
      name: "John O'Brien",
      email: "john.obrien@example.com",
      username: "john_obrien",
      password: "SecurePass123!"
    },
    expectedError: false
  },
  {
    name: "Minimum length violations",
    data: {
      name: "J",
      email: "test@example.com",
      username: "ab",
      password: "Test123!@#"
    },
    expectedError: true
  }
];

console.log("=".repeat(60));
console.log("INPUT VALIDATION TEST CASES");
console.log("=".repeat(60));
console.log("\nThese test cases should be used to verify the validation:");
console.log("\n");

testCases.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Expected: ${test.expectedError ? 'REJECTED' : 'ACCEPTED'}`);
  console.log(`   Data:`, JSON.stringify(test.data, null, 2));
  console.log("");
});

console.log("=".repeat(60));
console.log("MANUAL TESTING INSTRUCTIONS:");
console.log("=".repeat(60));
console.log(`
1. Start the server: cd server && npm start
2. Start the client: cd client && npm run dev
3. Open the registration page in your browser
4. Try entering the following in the form fields:

   Test 1: Special characters in name
   - Name: <script>alert('xss')</script>
   - Should be automatically stripped/rejected

   Test 2: Invalid username characters
   - Username: test@user!
   - Should only allow alphanumeric, underscore, hyphen

   Test 3: Excessive length
   - Try typing more than 50 characters in name field
   - Should be automatically limited

   Test 4: Valid input with special name characters
   - Name: John O'Brien
   - Should be accepted (apostrophes are allowed)

5. Check browser console and network tab for validation errors
6. Verify that error messages are user-friendly and specific
`);
