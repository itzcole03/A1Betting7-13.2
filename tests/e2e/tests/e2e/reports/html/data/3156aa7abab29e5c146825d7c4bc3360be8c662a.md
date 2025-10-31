# Page snapshot

```yaml
- generic [ref=e2]:
  - 'button "Dev: View Dashboard" [ref=e4] [cursor=pointer]'
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic "Backend API health" [ref=e7]: API Online
      - generic [ref=e9]: "WebSocket: Disconnected"
    - button "Open Navigation" [ref=e10] [cursor=pointer]:
      - img [ref=e12]
    - generic [ref=e13]:
      - link "PropFinder Link" [ref=e14] [cursor=pointer]:
        - /url: /propfinder
        - text: PropFinder
      - link "Plus EV Feed Link" [ref=e15] [cursor=pointer]:
        - /url: /ev-feed
        - text: +EV Feed
      - link "Arbitrage Link" [ref=e16] [cursor=pointer]:
        - /url: /arbitrage
        - text: Arbitrage
      - link "Line Shopping Link" [ref=e17] [cursor=pointer]:
        - /url: /line-shopping
        - text: Line Shopping
      - button "Admin" [ref=e18] [cursor=pointer]
      - button "Switch to User" [ref=e19] [cursor=pointer]
    - generic [ref=e23]: Loading PropFinder opportunities...
```