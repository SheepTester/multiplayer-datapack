# multiplayer-datapack

Hosts an HTTP server for collaborative Minecraft datapack editing using the
Monaco editor.

## Development

I believe this requires `ts-node` and `nodemon` globally installed. (`npm
install --global ...`)

```sh
# Build the editor for production
npm run build

# Start local server that monitors changes in server/ and hosts the server on
# port 10068.
nodemon -- -p 10068
```
