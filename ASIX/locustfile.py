# pyrefly: ignore [missing-import]
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    # Simulates a user waiting between 1 and 5 seconds between tasks
    wait_time = between(1, 5)

    @task(3)
    def index_page(self):
        # Stress test the frontend route
        self.client.get("/")

    @task(1)
    def api_health(self):
        # Stress test the backend health endpoint (if exists)
        with self.client.get("/api/health", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status code {response.status_code}")

    def on_start(self):
        """
        Executed when a simulated user starts.
        Could be used for login.
        """
        pass
