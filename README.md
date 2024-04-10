To run:

0. Clone repo
1. Run `npm install` from project root
2. Add a .env file to project root with `API_PORT=3003`
3. Create a GCP Storage bucket called "course-collab-bucket" and create then download a new key, ideally for a service account with Storage Admin access for simplicity. Once the key is downloaded, set it up as an env var: `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/downloaded-key-file.json"`
4. Run `npm start`