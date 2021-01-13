# multiplayer-datapack

Hosts an HTTP server for collaborative Minecraft datapack editing using the
Monaco editor.

## Use

Clone this repository, then build the editor. You can get the pre-built editor
from the [releases
page](https://github.com/SheepTester/multiplayer-datapack/releases) or build it
yourself.

```sh
# Install dependencies
npm install --global ts-node
npm install

# Do this if you want to build the editor yourself
npm run build

# Start the server
npm start
```

## Development

I believe this requires `ts-node` and `nodemon` globally installed. (`npm
install --global ...`)

```sh
npm install --global nodemon

# Concurrently start watching for changes in editor/. --host 0.0.0.0 will make
# the server listen for other computers in the network.
npm run serve -- --port 10070 --host 0.0.0.0 &
# Start local server that monitors changes in server/ and hosts the server on
# port 10068.
nodemon -- --port 10068 --debug "http://localhost:10070"
```
