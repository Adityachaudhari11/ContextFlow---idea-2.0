# Deployment Rules

**CRITICAL: Do NOT deploy to any other region or project.**

1. **Project**: `contextflow-497616`
2. **Service Name**: `contextflow`
3. **Region**: `asia-east1` (Taiwan) — *This is the closest free-tier region to India.*
4. **Memory limit**: `2Gi` (Required for the local embedding model, still falls under the Free Tier limits).
5. **Command**: 
   ```bash
   gcloud run deploy contextflow --source . --region asia-east1 --memory 2Gi --allow-unauthenticated --project contextflow-497616 --env-vars-file deploy-env.yaml
   ```

Do not deploy to `us-central1` or `asia-south1`. We are strictly staying on `asia-east1` to remain in the Free Tier while being as close to India as possible.
