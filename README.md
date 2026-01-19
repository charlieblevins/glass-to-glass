# Glass to Glass

Measure latency with a screen recording of two clocks.

## Concepts

See the [FAQ Page](https://glass-to-glass.cblevins.com/faq)

## Testing

- Use the [test video creator](https://glass-to-glass.cblevins.com/test-video-create) to generate an mp4 with a latency of your choice synthetically applied.

## Architecture

### Vite + React + Ts template

This project was created with the vite `react-ts` template as [described here](https://vite.dev/guide/).

### Code Structure Goals

1. Only error logs in the console, printed by console.error
   a. No non-error logs please
   b. No thrown exceptions please

## TODO

- [ ] reject or shorten files longer than 15 seconds
- [ ] hide frame data table under disclosure triangle
- [ ] show graph of frame latency over time
- [ ] show pie chart of % skipped
- [ ] show pie chart of skipped reason
- [ ] prevent "6" being read as "0"
