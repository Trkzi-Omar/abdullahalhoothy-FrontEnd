## Behavior
1. In /auth route, when refreshing the page, a request is sent to login as a guest(if no already credentials). This happen when ``initializeAuth();`` inside the useEffect -> AuthContext.tsx file.
2. If user is not logged in and wnet straightly to /, then he will be redirected to /auth, log him in and store credentials, then go back again to the /.