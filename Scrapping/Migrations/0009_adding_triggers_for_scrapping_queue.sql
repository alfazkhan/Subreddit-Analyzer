-- Function to send notification on queue mutation
CREATE OR REPLACE FUNCTION notify_queue_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('queue_updates', 'queue_changed');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger attached to scraping_queue table
DROP TRIGGER IF EXISTS queue_changed_trigger ON scraping_queue;
CREATE TRIGGER queue_changed_trigger
AFTER INSERT OR UPDATE OR DELETE ON scraping_queue
FOR EACH STATEMENT
EXECUTE FUNCTION notify_queue_change();