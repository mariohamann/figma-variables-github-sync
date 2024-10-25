<script>
  import { onMount } from "svelte";
  import { Octokit } from "@octokit/core";
  import { createOrUpdateTextFile } from "@octokit/plugin-create-or-update-text-file";
  import { writable } from "svelte/store";
  import { on, emit } from '@create-figma-plugin/utilities'

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
        emit('notify', 'No authentication provided');
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
      emit('notify', 'Owner, repo, or octokit not set');
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
    emit('notify', 'Branches updated');
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
    emit('get-config');
  };

  // Handle on-mount actions
  onMount(() => {
    getConfig();
    initializeOctokit();
    getBranches();
  });

  // Handle repository data updates
  on('RECEIVE-CONFIG', (d) => {
    console.log('Received config', d);
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
  on('TO-GITHUB', async (content) => {
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
  <!-- Owner Input -->
  <div class="input">
    <label for="owner" class="label">Owner:</label>
    <input id="owner" type="text" class="input__field" bind:value={$config.owner} />
  </div>

  <!-- Repo Input -->
  <div class="input">
    <label for="repo" class="label">Repo:</label>
    <input id="repo" type="text" class="input__field" bind:value={$config.repo} />
  </div>

  <!-- Path Input -->
  <div class="input">
    <label for="path" class="label">Path:</label>
    <input id="path" type="text" class="input__field" bind:value={$config.path} />
  </div>

  <!-- Auth Input -->
  <div class="input">
    <label for="auth" class="label">Auth:</label>
    <input id="auth" type="text" class="input__field" bind:value={$config.auth} />
  </div>

  <!-- Branch Select -->
  <div class="input">
    <label for="branch" class="label">Branch:</label>
    <select id="branch" class="select-menu" bind:value={$config.branch}>
      {#each $branches as branch}
        <option value={branch}>{branch}</option>
      {/each}
    </select>
    <button class="button button--secondary" on:click={getBranches}>Refresh</button>
  </div>

  <!-- Action Buttons -->
  <button class="button button--tertiary">Cancel</button>
  <button class="button button--primary" on:click={() => emit('save-config', $config)}>Save</button>
  <hr />

  <!-- Secondary Action Buttons -->
  <button class="button button--tertiary" on:click={() => emit('close')}>Close</button>
  <button class="button button--primary" on:click={() => emit('get-variables')}>Get JSON</button>
  <button class="button button--primary" on:click={() => emit('send-to-github')}>Push to GitHub</button>

  <!-- Status Message -->
  <p class="type type--small">{$state}</p>
</div>
