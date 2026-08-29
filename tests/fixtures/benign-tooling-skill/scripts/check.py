import subprocess
from urllib.parse import urlparse, unquote


def rev(ref):
    try:
        return subprocess.check_output(["git", "rev-parse", ref], text=True)
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return None


def host(target):
    return urlparse(target).netloc
