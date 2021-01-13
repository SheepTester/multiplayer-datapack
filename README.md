# multiplayer-datapack

Hosts an HTTP server for collaborative Minecraft datapack editing using the
Monaco editor.

## Use

1. Clone this repository and install the Node dependencies. You'll need to have
[Node](https://nodejs.org/) installed.

    ```sh
    # Clone repository
    git clone https://github.com/SheepTester/multiplayer-datapack.git

    # Install dependencies
    npm install --global ts-node
    npm install
    ```

2. Create a password

3. Build the editor.

    1. You can get the pre-built editor from the [releases
    page](https://github.com/SheepTester/multiplayer-datapack/releases). Unzip it in this folder.

    2. You can also build it yourself.

        ```sh
        # Build editor for production
        npm run build
        ```

4. Start the server.

    ```sh
    npm start -- -b path/to/datapack/folder
    ```

    You can do `npm start -- --help` for a list of options.

## Development

I believe this requires `ts-node` and `nodemon` globally installed.

```sh
npm install --global nodemon

# Concurrently start watching for changes in editor/. --host 0.0.0.0 will make
# the server listen for other computers in the network.
npm run serve -- --port 10070 --host 0.0.0.0 &
# Start local server that monitors changes in server/ and hosts the server on
# port 10068.
nodemon -- --port 10068 --debug "http://localhost:10070"
```
