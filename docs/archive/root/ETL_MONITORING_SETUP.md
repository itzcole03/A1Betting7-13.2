# ETL Monitoring & Alerting Setup Instructions

1. **Prometheus**

   - Add the metrics endpoint (port 8001) to your Prometheus scrape config.
   - Example:
     ```yaml
     scrape_configs:
       - job_name: "etl_pipeline"
         static_configs:
           - targets: ["localhost:8001"]
     ```
   - Set up alert rules for ETL job failures, high error rates, or low throughput.

2. **Sentry**

   - Add your Sentry DSN to the environment config.
   - Monitor for error events and set up alerting policies for critical failures.

3. **Slack**

   - Add your Slack webhook URL to the environment config.
   - Confirm alerts are sent for critical ETL errors.

4. **Health Checks**

   - Use the `etl_health_check()` function or Prometheus metrics endpoint to monitor ETL readiness.

5. **Continuous Review**
   - Schedule regular reviews of ETL performance and reliability.
   - Document lessons learned and edge cases in architecture docs.

---

For questions or feedback, contact the architecture team.
