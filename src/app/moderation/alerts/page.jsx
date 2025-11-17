import { Card, CardContent, Stack, Typography } from "@mui/material";

import ModerationAlertsPanel from "@/components/moderation/ModerationAlertsPanel";

const ModerationAlertsPage = () => {
  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Moderation Alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review every automated block with actor context, copyable resource IDs, and direct links to the offending asset.
          </Typography>
        </CardContent>
      </Card>
      <ModerationAlertsPanel limit={50} />
    </Stack>
  );
};

export default ModerationAlertsPage;
