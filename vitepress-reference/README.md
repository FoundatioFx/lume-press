# VitePress reference

A VitePress build of [`docs/`](../docs), used to check that LumePress renders
the same pages as VitePress's default theme.

- `.vitepress/config.ts` mirrors `docs/_config.ts`, with the sidebar written
  out to match the one LumePress generates. Keep the two in sync.
- `.vitepress/theme/` adds the LumePress extras VitePress lacks (home sections
  and Mermaid), so both sites show the same content.

```sh
vp run vitepress:dev        # serve it
vp run compare:vitepress    # compare it with the LumePress build
```

See [VitePress Parity](../docs/guide/vitepress-parity.md).
