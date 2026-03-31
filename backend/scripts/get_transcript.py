"""
Fetches YouTube transcript using youtube-transcript-api.
Called from Node.js via child_process.
Usage: python get_transcript.py <video_id>
Returns JSON array to stdout.
"""
import sys
import json
import os
import random
import requests

from youtube_transcript_api import YouTubeTranscriptApi

# Disable SSL verification warnings if we use ScraperAPI
requests.packages.urllib3.disable_warnings()

def main():
    if len(sys.argv) < 2:
        sys.stdout.buffer.write(json.dumps({"error": "No video ID provided"}).encode('utf-8'))
        sys.exit(1)

    video_id = sys.argv[1]

    # Enable ScraperAPI proxy if the key is provided
    api_key = os.environ.get("SCRAPER_API_KEY")
    http_client = None
    
    if api_key:
        # Generate a random session ID to force ScraperAPI to rotate IP address
        session_id = random.randint(1, 1000000)
        proxy_url = f"http://scraperapi.premium=true.session_number={session_id}:{api_key}@proxy-server.scraperapi.com:8001"
        
        # Monkey patch requests to ignore SSL verify if we're using proxy
        # since ScraperAPI uses its own SSL certificates
        old_request = requests.Session.request
        def new_request(self, method, url, **kwargs):
            kwargs['verify'] = False
            return old_request(self, method, url, **kwargs)
        requests.Session.request = new_request

        os.environ["HTTP_PROXY"] = proxy_url
        os.environ["HTTPS_PROXY"] = proxy_url
        os.environ["http_proxy"] = proxy_url
        os.environ["https_proxy"] = proxy_url

    try:
        # Check which version of the API we are using
        if hasattr(YouTubeTranscriptApi, 'list_transcripts'):
            # Old API (0.6.x)
            try:
                # Try to get English transcript first
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                transcript = transcript_list.find_transcript(['en'])
            except Exception:
                # Fallback: try any available language
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                transcript = list(transcript_list)[0]

            fetched = transcript.fetch()
            # In 0.6.x, fetched is a list of dicts
            snippets = fetched
        else:
            # New API (1.x+)
            api = YouTubeTranscriptApi()
            try:
                # Try to get English transcript first
                transcript_list = api.list(video_id)
                transcript = transcript_list.find_transcript(['en'])
            except Exception:
                # Fallback: try any available language
                transcript_list = api.list(video_id)
                transcript = list(transcript_list)[0]

            fetched = transcript.fetch()
            # In 1.x+, fetched is a FetchedTranscript object with a snippets attribute
            snippets = fetched.snippets

        # Output as JSON array with offset, duration, text
        result = [
            {
                "offset": getattr(entry, "start", entry.get("start") if isinstance(entry, dict) else 0),
                "duration": getattr(entry, "duration", entry.get("duration") if isinstance(entry, dict) else 0),
                "text": getattr(entry, "text", entry.get("text") if isinstance(entry, dict) else ""),
                "lang": getattr(transcript, "language_code", "en")
            }
            for entry in snippets
        ]
        
    except Exception as e:
        sys.stdout.buffer.write(json.dumps({"error": str(e)}, ensure_ascii=False).encode('utf-8'))
        sys.exit(1)

    sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))

if __name__ == "__main__":
    main()
