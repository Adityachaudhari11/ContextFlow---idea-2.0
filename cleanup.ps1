$revisions = (gcloud.cmd run revisions list --service contextflow --region asia-south1 --format="value(metadata.name)" --sort-by="~metadata.creationTimestamp")
$toDelete = $revisions | Select-Object -Skip 3
if ($toDelete) {
    Write-Host "Deleting old revisions: $toDelete"
    foreach ($rev in $toDelete) {
        gcloud.cmd run revisions delete $rev --region asia-south1 --quiet
    }
} else {
    Write-Host "No old revisions to delete (keeping latest 3)."
}
