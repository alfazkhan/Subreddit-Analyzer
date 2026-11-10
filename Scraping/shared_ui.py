from rich.table import Table
from rich.console import Group
from rich.live import Live


class WorkerUI:
    def __init__(self):
        self.subreddit = "Standby"
        self.action = "Initializing Engine..."
        self.current_post = "-"
        self.last_result = "-"
        
        self.total = 0
        self.pending = 0
        self.processing = 0
        self.completed = 0
        self.failed = 0
        self.live = None

    def start_live(self):
        """Start the Rich Live display and attach it to this UI manager."""
        if self.live is None:
            self.live = Live(self.render(), refresh_per_second=4)
            self.live.start()

    def stop_live(self):
        """Stop the Rich Live display."""
        if self.live is not None:
            self.live.stop()
            self.live = None

    async def refresh_db_counts(self):
        """Fetch live queue counts from the database and update the status row."""
        try:
            from database.queue import get_queue_state
            counts, _ = await get_queue_state(limit=0)
            self.total = counts.get('total', 0)
            self.pending = counts.get('pending', 0)
            self.processing = counts.get('processing', 0)
            self.completed = counts.get('completed', 0)
            self.failed = counts.get('failed', 0)
        except Exception:
            pass  # keep last known counts on failure

    def render(self):
        task_table = Table(title="Subreddit Analyzer - Live Worker Engine", show_header=True, header_style="bold magenta", expand=True)
        task_table.add_column("Target Subreddit", style="cyan", width=20)
        task_table.add_column("Active Process", style="yellow", width=25)
        task_table.add_column("Current Post ID", style="blue", width=15)
        task_table.add_column("Last Result", style="green")
        
        task_table.add_row(
            self.subreddit,
            self.action,
            self.current_post,
            self.last_result
        )

        status_table = Table(show_header=True, header_style="bold white", expand=True)
        status_table.add_column("Total in Queue", justify="center")
        status_table.add_column("Pending", justify="center", style="cyan")
        status_table.add_column("Processing", justify="center", style="yellow")
        status_table.add_column("Completed", justify="center", style="green")
        status_table.add_column("Failed", justify="center", style="red")

        status_table.add_row(
            str(self.total),
            str(self.pending),
            str(self.processing),
            str(self.completed),
            str(self.failed)
        )

        return Group(task_table, status_table)

    def update(self, subreddit=None, action=None, current_post=None, last_result=None, db_counts=None):
        if subreddit is not None: self.subreddit = subreddit
        if action is not None: self.action = action
        if current_post is not None: self.current_post = current_post
        if last_result is not None: self.last_result = last_result
        if db_counts is not None:
            self.total = db_counts.get('total', 0)
            self.pending = db_counts.get('pending', 0)
            self.processing = db_counts.get('processing', 0)
            self.completed = db_counts.get('completed', 0)
            self.failed = db_counts.get('failed', 0)
        
        if self.live:
            self.live.update(self.render())

ui_manager = WorkerUI()
