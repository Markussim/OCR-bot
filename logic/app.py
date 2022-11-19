from flask import Flask, request
import requests
import os
from dotenv import load_dotenv
import random

load_dotenv("../.env")

app = Flask(__name__)


def sendDiscordMessage(messageIn, channel):
    # Send message to discord
    requests.post("https://discord.com/api/v8/channels/" + channel + "/messages",
                  headers={"Authorization": "Bot " + os.getenv("TOKEN")},
                  data={"content": messageIn})


@app.route("/", methods=['POST'])
def hello():
    # Get the request body
    req = request.get_json()

    message = req["body"]["message"]["d"]

    if (len(req["body"]["message"]["d"]["attachments"]) > 0):
        url = message["attachments"][0]["url"]

        # Return if the message is not a photo
        if (url[-3:] != "png" and url[-3:] != "jpg"):
            return "ok"
        fileEnding = url[-3:]

        # Load the image into memory
        image = requests.get(url)
        # Create random file name
        imageName = str(random.randint(0, 1000000000)) + "." + fileEnding

        # Save the image to disk
        with open(imageName, "wb") as f:
            f.write(image.content)

        messageOut = "Image received with a size of " + \
            str(len(image.content)) + " bytes."

        channel = message["channel_id"]
        sendDiscordMessage(messageOut, channel)

        # Delete the image from disk
        os.remove(imageName)

    return "Hello, World!"


if __name__ == "__main__":
    app.run(debug=True, port=3000)
