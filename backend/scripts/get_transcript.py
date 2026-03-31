"""
Fetches YouTube transcripts using youtube-transcript-api.
Accepts multiple video IDs and returns a JSON dictionary of transcripts.
Usage: python get_transcript.py <vid1> <vid2> ...
"""
import sys
import json
import os
import random
import requests

from youtube_transcript_api import YouTubeTranscriptApi

requests.packages.urllib3.disable_warnings()

def main():
    if len(sys.argv) < 2:
        sys.stdout.buffer.write(json.dumps({"error": "No video IDs provided"}).encode('utf-8'))
        sys.exit(1)

    video_ids = sys.argv[1:]

    # Enable ScraperAPI proxy if the key is provided
    api_key = os.environ.get("SCRAPER_API_KEY")
    if api_key:
        session_id = random.randint(1, 1000000)
        proxy_url = f"http://scraperapi.premium=true.session_number={session_id}:{api_key}@proxy-server.scraperapi.com:8001"
        old_request = requests.Session.request
        def new_request(self, method, url, **kwargs):
            kwargs['verify'] = False
            return old_request(self, method, url, **kwargs)
        requests.Session.request = new_request

        os.environ["HTTP_PROXY"] = proxy_url
        os.environ["HTTPS_PROXY"] = proxy_url
        os.environ["http_proxy"] = proxy_url
        os.environ["https_proxy"] = proxy_url

    results = {}

    for video_id in video_ids:
        try:
            if hasattr(YouTubeTranscriptApi, 'list_transcripts'):
                try:
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    transcript = transcript_list.find_transcript(['en'])
                except Exception:
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    transcript = list(transcript_list)[0]
                snippets = transcript.fetch()
            else:
                api = YouTubeTranscriptApi()
                try:
                    transcript_list = api.list(video_id)
                    transcript = transcript_list.find_transcript(['en'])
                except Exception:
                    transcript_list = api.list(video_id)
                    transcript = list(transcript_list)[0]
                snippets = transcript.fetch().snippets

            results[video_id] = [
                {
                    "offset": getattr(entry, "start", entry.get("start") if isinstance(entry, dict) else 0),
                    "duration": getattr(entry, "duration", entry.get("duration") if isinstance(entry, dict) else 0),
                    "text": getattr(entry, "text", entry.get("text") if isinstance(entry, dict) else ""),
                    "lang": getattr(transcript, "language_code", "en")
                }
                for entry in snippets
            ]
        except Exception as e:
            # If missing subtitles or subtitles disabled, mark it as null so NodeJS knows it's unretrievable
            results[video_id] = None

    sys.stdout.buffer.write(json.dumps({"data": results}, ensure_ascii=False).encode('utf-8'))

if __name__ == "__main__":
    main()
