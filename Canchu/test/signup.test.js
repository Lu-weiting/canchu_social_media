const request = require("supertest");
const server = require("../app");
const { QUERY } = require("../database");

process.env.NODE_ENV = 'test';

afterEach(async () => {
    await QUERY("DELETE FROM users");
});
describe("POST /users/signup", () => {
    test("signup - success: 200", async () => {
        const newUser = await request(server)
          .post("/api/1.0/users/signup")
          .send({
            name: "test",
            email: "test@gmail.com",
            password: "test"
          });
    
        expect(newUser.body).toHaveProperty("data");
        expect(newUser.body.data).toHaveProperty("access_token");
        expect(newUser.body.data).toHaveProperty("user");
        expect(newUser.body.data.user).toHaveProperty("id");
        expect(newUser.body.data.user).toHaveProperty("picture");
    
        expect(newUser.body.data.user.name).toBe("test");
        expect(newUser.body.data.user.email).toBe("test@gmail.com");
        expect(newUser.body.data.user.provider).toBe("native");
        
        expect(newUser.statusCode).toBe(200);
      });
      test("signup - email is wrong format: 400", async () => {
        const newUser = await request(server)
          .post("/api/1.0/users/signup")
          .send({
            name: "test",
            email: "testgmail.com",
            password: "test"
          });
    
          expect(newUser.body.error).toEqual('Client error - email format is not valid');
          expect(newUser.statusCode).toBe(400);
      });
      test("signup - name can't be empty: 400", async () => {
        const newUser = await request(server)
          .post("/api/1.0/users/signup")
          .send({
            email: "test@gmail.com",
            password: "test"
          });
    
          expect(newUser.body.error).toEqual('Client error - input feild should not be empty');
          expect(newUser.statusCode).toBe(400);
      });
      test("signup - no email: 400", async () => {
        const newUser = await request(server)
          .post("/api/1.0/users/signup")
          .send({
            name: "test",
            password: "test"
          });
    
          expect(newUser.body.error).toEqual('Client error - input feild should not be empty');
          expect(newUser.statusCode).toBe(400);
      });
      test("signup - no password: 400", async () => {
        const newUser = await request(server)
          .post("/api/1.0/users/signup")
          .send({
            name: "test",
            email: "test@gmail.com"
          });
    
          expect(newUser.body.error).toEqual('Client error - input feild should not be empty');
          expect(newUser.statusCode).toBe(400);
      });
    
      test("signup - user has existed: 403", async () => {
        const newUser = await request(server)
          .post("/api/1.0/users/signup")
          .send({
            name: "test",
            email: "test@gmail.com",
            password: "test"
          });
        const duplicateUser = await request(server)
          .post("/api/1.0/users/signup")
          .send({
            name: "test",
            email: "test@gmail.com",
            password: "test"
          });
    
          expect(newUser.statusCode).toBe(200);
    
          expect(duplicateUser.body.error).toEqual('Email already exists');
          expect(duplicateUser.statusCode).toBe(403);
      });
});
