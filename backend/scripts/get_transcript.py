"""
Fetches YouTube transcript using youtube-transcript-api.
Called from Node.js via child_process.
Usage: python get_transcript.py <video_id>
Returns JSON array to stdout.
"""
import sys
import json

from youtube_transcript_api import YouTubeTranscriptApi

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video ID provided"}))
        sys.exit(1)

    video_id = sys.argv[1]

    try:
        api = YouTubeTranscriptApi()
        try:
            # Try to get English transcript first
            transcript_list = api.list(video_id)
            transcript = transcript_list.find_transcript(['en'])
        except Exception:
            # Fallback: try any available language
            transcript_list = api.list(video_id)
            # just get the first transcript available
            transcript = list(transcript_list)[0]

        fetched = transcript.fetch()

        # Output as JSON array with offset, duration, text
        result = [
            {
                "offset": getattr(entry, "start", entry.get("start") if isinstance(entry, dict) else 0),
                "duration": getattr(entry, "duration", entry.get("duration") if isinstance(entry, dict) else 0),
                "text": getattr(entry, "text", entry.get("text") if isinstance(entry, dict) else ""),
                "lang": getattr(transcript, "language_code", "en")
            }
            for entry in fetched.snippets
        ]
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    print(json.dumps(result))

if __name__ == "__main__":
    main()
