# Part D: One-Time Setup

Perform these onboarding procedures once. Each step includes a verification check. If any step fails, consult [Part M: Diagnostic Matrix](/part-m) or contact DevOps.

---

## Step 1: GitHub Account and 2FA

1. Sign in to your personal GitHub account.
2. Enable two-factor authentication under **Settings > Password and authentication** using an authenticator application.
3. Accept the organization invitation sent to your email for `specv-automations`.

**Verification Check:** Ensure you can access and view the private repositories within the `specv-automations` organization.

---

## Step 2: Install Software on Your Laptop

Install the following utilities on your local machine:

- **Visual Studio Code** (the primary editor)
- **Remote - SSH extension** for VS Code (available in the Extensions Marketplace)
- **Git** command-line client
- **Tailscale** client ([tailscale.com/download](https://tailscale.com/download))

---

## Step 3: Generate an SSH Key on Your Laptop

An SSH key consists of two matching cryptographic files:
- **Private key:** Kept secure on your laptop.
- **Public key:** Installed on the server lockbox.

Open your local terminal (macOS/Linux Terminal or Windows PowerShell):

```bash
ssh-keygen -t ed25519 -C "yourname@company"
```

1. Press `Enter` to accept the default file storage location.
2. Set a secure passphrase protecting the local key file.
3. Print your public key:

```bash
# macOS / Linux
cat ~/.ssh/id_ed25519.pub

# Windows PowerShell
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

Send the output string (beginning with `ssh-ed25519`) to DevOps. Never transmit the private key without the `.pub` extension.

---

## Step 4: Join the Tailscale Mesh Network

1. Accept the Tailscale email invitation issued by DevOps and authenticate.
2. Launch and sign in to the Tailscale desktop client on your laptop.
3. DevOps will assign you the dev server mesh IP address (`100.x.y.z`).

**Verification Check:** The Tailscale icon indicates an active connection. Tailscale must remain active whenever connecting to internal development workspaces.

---

## Step 5: Connect VS Code to the Remote Workspace

1. Open or create your SSH configuration file at `~/.ssh/config` (Windows: `C:\Users\YOU\.ssh\config`).
2. Append the target definition:

```text
Host specv-dev
    HostName 100.x.y.z          # The Tailscale IP provided by DevOps
    Port 2222
    User node
    IdentityFile ~/.ssh/id_ed25519
```

3. Inside VS Code, press `F1` (or `Ctrl+Shift+P` / `Cmd+Shift+P`), choose **Remote-SSH: Connect to Host**, and select `specv-dev`.
4. Accept the initial host fingerprint prompt. Allow VS Code 30 to 60 seconds to initialize the server agent.
5. Select **File > Open Folder** and point to `/home/node`.

**Verification Check:** Open a terminal in VS Code (**Terminal > New Terminal**) and execute:

```bash
node -v        # Must return v24.x.x
git --version
npm -v
whoami         # Must return node
```

::: tip WORKSPACE EXECUTION CONTEXT
Your VS Code interface runs locally on your workstation, but all filesystem operations, compilers, and processes execute inside the isolated server container.
:::

---

## Step 6: Configure Git Inside the Workspace

The workspace runs in an isolated container environment and requires its own dedicated Git credentials and GitHub SSH key:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase false

ssh-keygen -t ed25519 -C "your-github-user (dev workspace)"
cat ~/.ssh/id_ed25519.pub
```

Copy the printed public key. In GitHub, navigate to **Settings > SSH and GPG keys > New SSH key**, and paste the key.

::: tip KEY PAIR SEPARATION
This is a distinct key pair from Step 3. The Step 3 key authorizes your workstation to connect to the dev workspace container. The Step 6 key authorizes the dev workspace container to authenticate with GitHub.
:::

**Verification Check:** Verify your remote connection:

```bash
ssh -T git@github.com
# Expected output: "Hi your-user! You've successfully authenticated..."
```

---

## Step 7: Clone and Boot a Project Service

```bash
cd ~
git clone git@github.com:specv-automations/pcb.git
cd pcb
npm ci
cp .env.example .env
```

Request the sandbox database credentials from DevOps, then provision your isolated database:

```bash
createdb -h dev-postgres -U dev pcb_dev
```

Configure your local `.env` file:

```text
DATABASE_URL=postgres://dev:THE_DEV_PASSWORD@dev-postgres:5432/pcb_dev
PORT=3000
NODE_ENV=development
```

Start the development process:

```bash
npm run dev
```

**Verification Check:** In VS Code, navigate to the **Ports** tab adjacent to the Terminal panel. Port `3000` is forwarded to your laptop automatically. Visit `http://localhost:3000` in your browser to verify the service interface, and check `http://localhost:3000/healthz` to confirm the probe returns `ok`.

::: tip PRACTICE DATABASE ISOLATION
The sandbox database is fully isolated from production infrastructure. You have full administrative rights to populate, alter, or drop practice tables.
:::