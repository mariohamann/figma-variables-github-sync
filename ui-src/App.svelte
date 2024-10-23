<script>
  import { onMount } from "svelte";
  import { On, SendToFigma } from "./modules/FigmaUtilities";
  import { Octokit } from "@octokit/core";
  import { createOrUpdateTextFile } from "@octokit/plugin-create-or-update-text-file";
  import { writable } from "svelte/store";

  // State object for all repo data and authentication
  let config = writable({
    owner: "",
    repo: "",
    path: "",
    auth: "",
    branch: "",
  });
  
  let state = writable("");
  let branches = writable([]);
  let octokit = null; // Keep octokit as persistent state

  // Initialize Octokit only once
  const initializeOctokit = () => {
    if (!octokit) {
      const { auth } = $config;
      if (!auth) {
        SendToFigma('notify', 'No authentication provided');
        return;
      }

      // Initialize Octokit with the createOrUpdateTextFile plugin
      const MyOctokit = Octokit.plugin(createOrUpdateTextFile);
      octokit = new MyOctokit({ auth });
    }
  };

  // Fetch branches from GitHub
  const getBranches = async () => {
    const { owner, repo } = $config;

    if (!owner || !repo || !octokit) {
      SendToFigma('notify', 'Owner, repo, or octokit not set');
      return;
    }

    // Initialize Octokit before making any requests
    initializeOctokit();

    const defaultBranch = await getDefaultBranch();
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/branches", {
      owner,
      repo,
    });

    branches.set([defaultBranch, ...data.map(b => b.name).filter(b => b !== defaultBranch)]);
    SendToFigma('notify', 'Branches updated');
  };

  const getDefaultBranch = async () => {
    initializeOctokit();
    const { owner, repo } = $config;

    const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
    });

    return data.default_branch;
  };

  const getConfig = () => {
    SendToFigma('get-config');
  };

  // Handle on-mount actions
  onMount(() => {
    getConfig();
    initializeOctokit();
    getBranches();
  });

  // Handle repository data updates
  On('RECEIVE-CONFIG', (m, d) => {
    config.set({
      owner: d.owner,
      repo: d.repo,
      path: d.path,
      auth: d.auth,
      branch: d.branch,
    });
    initializeOctokit();
    getBranches();
  });

  // Push to GitHub
  On('TO-GITHUB', async (m, content) => {
    const { owner, repo, path, branch } = $config;

    state.set("Sending to GitHub...");

    initializeOctokit(); // Ensure Octokit is initialized

    const { updated, data } = await octokit.createOrUpdateTextFile({
      owner,
      repo,
      path: path || "figma.json",
      branch: branch || "main",
      content,
      message: "Update Figma Variables",
    });

    if (updated) {
      state.set(`Updated via ${data.commit.html_url}`);
    } else {
      state.set("Already up to date");
    }
  });
</script>

<div>
  <div>
    <label for="owner">Owner:</label>
    <input id="owner" type="text" bind:value={$config.owner} />
  </div>
  <div>
    <label for="repo">Repo:</label>
    <input id="repo" type="text" bind:value={$config.repo} />
  </div>
  <div>
    <label for="path">Path:</label>
    <input id="path" type="text" bind:value={$config.path} />
  </div>
  <div>
    <label for="auth">Auth:</label>
    <input id="auth" type="text" bind:value={$config.auth} />
  </div>
  <div>
    <label for="branch">Branch:</label>
    <select id="branch" bind:value={$config.branch}>
      {#each $branches as branch}
        <option value={branch}>{branch}</option>
      {/each}
    </select>
    <button on:click={getBranches}>Refresh</button>
  </div>

  <button>Cancel</button>
  <button on:click={() => SendToFigma('save-config', $config)}>Save</button>
  <hr />
  <button on:click={() => SendToFigma('close')}>Close</button>
  <button on:click={() => SendToFigma('get-variables')}>Get JSON</button>
  <button on:click={() => SendToFigma('send-to-github')}>Push to GitHub</button>

  <p>{$state}</p>
</div>
