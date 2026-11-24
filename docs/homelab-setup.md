# Homelab deployment setup

Every push to `main` builds the image on GitHub and stores it in GitHub's container registry (GHCR). A
**self-hosted GitHub Actions runner on the homelab** then pulls it and restarts the container.

```
 git push ──► GitHub Actions (cloud): check + build ──► ghcr.io/<owner>/music-academy:sha-…
                                                                   │
              runner on the homelab (label music-academy-homelab) ◄┘
                docker compose pull && up -d, then GET /healthz
                                                                   │
                                          http://<server>:8082 ◄───┘  (behind your reverse proxy)
```

The runner connects *out* to GitHub, so no port is opened and GitHub gets no SSH key.

## 1. The runner

Runners of a personal account belong to one repository, so this repository needs its own runner, even if the
server already runs one for another repository. A second runner can live next to the first one, as the same
system user, in its own folder.

1. On GitHub: **Settings → Actions → Runners → New self-hosted runner**, Linux x64. Note the token.
2. On the server, as the runner's user (it must be in the `docker` group):

   ```bash
   mkdir ~/actions-runner-music-academy && cd ~/actions-runner-music-academy
   # download and unpack the runner as GitHub shows, then:
   ./config.sh --url https://github.com/<owner>/music-academy --token <TOKEN> \
     --name music-academy-homelab --labels music-academy-homelab --unattended
   ```

3. As root, install and start it as a service:

   ```bash
   ./svc.sh install <runner-user>
   ./svc.sh start
   ```

4. The runner shows up as **Idle** under Settings → Actions → Runners.

## 2. Lock it down (the repository is public)

Anyone in the `docker` group is effectively root on the server, and the runner runs this repository's compose file
as it is. So:

- The workflow runs on pushes, tags and manual runs only, never on pull requests.
- **Settings → Actions → General → Fork pull request workflows**: *Require approval for all external
  contributors*. A fork can add its own workflow file, and this setting stops it from running unapproved.
- Only add collaborators you'd give root on the server.
- Optional: **Settings → Environments → production → Required reviewers** makes every deploy wait for a click.

## 3. Settings

- **Port:** 8082 by default. Change it with the repository variable `HOMELAB_PORT`
  (Settings → Secrets and variables → Actions → Variables).
- **Address:** put a reverse proxy with https in front (Web MIDI and offline mode need https), and keep the address
  for good: the browser keeps progress per address.

## Everyday use

| I want to… | Do this |
| --- | --- |
| Deploy | `git push` to `main` |
| Make a release | `git tag v1.1.0 && git push origin v1.1.0` |
| Roll back | **Actions → Build & Deploy → Run workflow**, `image_tag` = an older tag (`1.0.0` or `sha-<commit>`) |
| See what runs | `docker ps --filter name=music-academy` |
| Logs | `docker logs music-academy` |
