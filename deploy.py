import os
import paramiko
from scp import SCPClient

# ----- CONFIG -----
LOCAL_DIR = "./"                     # Current directory
REMOTE_DIR = "/home/kchovi/flask_app"
SERVER_HOST = "192.168.1.100"       # Your server IP
SERVER_USER = "kchovi"
SERVER_PASSWORD = "Halinek272911"    # SSH password
FLASK_RUN_COMMAND = "cd /home/youruser/flask_app && nohup python3 app.py > log.txt 2>&1 &"
KILL_COMMAND = "pkill -f app.py"

EXCLUDE_DIRS = {".git", "__pycache__"}  # Folders to skip
# -------------------


def create_ssh():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD)
    return ssh


def deploy():
    print("Deploying to server...")

    ssh = create_ssh()
    scp = SCPClient(ssh.get_transport())

    # Ensure remote directory exists
    ssh.exec_command(f"mkdir -p {REMOTE_DIR}")

    # Walk through local directory and upload files/folders selectively
    for root, dirs, files in os.walk(LOCAL_DIR):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        # Upload each file
        for file in files:
            local_path = os.path.join(root, file)
            # Construct remote path
            rel_path = os.path.relpath(local_path, LOCAL_DIR)
            remote_path = os.path.join(REMOTE_DIR, rel_path)
            # Ensure remote folder exists
            remote_folder = os.path.dirname(remote_path)
            ssh.exec_command(f"mkdir -p {remote_folder}")
            scp.put(local_path, remote_path)

    # Kill old Flask process
    ssh.exec_command(KILL_COMMAND)
    # Start new Flask process
    ssh.exec_command(FLASK_RUN_COMMAND)

    scp.close()
    ssh.close()
    print("Deployment complete!")


if __name__ == "__main__":
    deploy()
