// describe('Test spec', () => {
//   it('passes', () => {
//     cy.visit('https://example.cypress.io')
//   })
// })
describe('User Authentication Tests', () => {
  const baseUrl = 'http://localhost:5000/api/v1'; // Replace with your backend URL
  
  const testUser = {
    fullName: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
    username: "testuser"
  };

  it('POST /register - should register a new user', () => {
    cy.request('POST', `${baseUrl}/users/register`, testUser).then((response) => {
      expect(response.status).to.eq(201); // Assuming successful registration returns 201
      expect(response.body).to.have.property('message', 'User registered successfully');
    });
  });

  it('POST /login - should login an existing user', () => {
    const loginData = {
      email: testUser.email,
      password: testUser.password,
      username: testUser.username
    };

    cy.request('POST', `${baseUrl}/users/login`, loginData).then((response) => {
      expect(response.status).to.eq(200); // Assuming successful login returns 200
      expect(response.body.data).to.have.property('accessToken');
    });
  });

  it('POST /login - should fail login with incorrect password', () => {
    const invalidLoginData = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    cy.request({
      method: 'POST',
      url: `${baseUrl}/users/login`,
      body: invalidLoginData,
      failOnStatusCode: false // Prevent Cypress from failing on non-2xx status codes
    }).then((response) => {
      expect(response.status).to.eq(401); // Assuming 401 for invalid login
      // expect(response.body).to.have.property('message', 'Invalid email or password');
    });
  });


  it('POST /login - should fail login with incorrect email', () => {
    const invalidLoginData = {
      email: "testwrongUser@example.com",
      password: 'wrongpassword'
    };

    cy.request({
      method: 'POST',
      url: `${baseUrl}/users/login`,
      body: invalidLoginData,
      failOnStatusCode: false // Prevent Cypress from failing on non-2xx status codes
    }).then((response) => {
      expect(response.status).to.eq(404); // Assuming 401 for invalid login
      // expect(response.body).to.have.property('message', 'Invalid email or password');
    });
  });

  after(() => {
    cy.request('POST', `${baseUrl}/users/login`, {
      email: testUser.email,
      password: testUser.password
    }).then((response) => {
      const token = response.body.data.accessToken;
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/users/delete-account`, // Replace with actual delete endpoint
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    });
  });
  

});
