
import { Octokit } from "@octokit/core";
import { createOrUpdateTextFile } from "@octokit/plugin-create-or-update-text-file";
import { on, emit } from "@create-figma-plugin/utilities";

class GitHubSyncPlugin {
  private config: { owner: string; repo: string; path: string; auth: string; branch: string; } = {
    owner: "",
    repo: "",
    path: "",
    auth: "",
    branch: "",
  };
  private octokit: any = null;
  private branches: string[] = [];
  private statusMessage: HTMLElement;

  constructor() {
    this.statusMessage = document.getElementById("statusMessage")!;
    this.initializeEventListeners();
    this.loadConfig();
  }

  // Initialize Octokit instance
  private initializeOctokit() {
    if (!this.octokit && this.config.auth) {
      const MyOctokit = Octokit.plugin(createOrUpdateTextFile);
      this.octokit = new MyOctokit({ auth: this.config.auth });
    }
  }

  // Load configuration from Figma
  private loadConfig() {
    emit("get-config");
  }

  // Initialize event listeners
  private initializeEventListeners() {
    const form = document.getElementById("configForm") as HTMLFormElement;
    const refreshButton = document.getElementById("refreshBranches")!;
    const closeButton = document.getElementById("closeBtn")!;
    const getVariablesButton = document.getElementById("getVariablesBtn")!;
    const pushButton = document.getElementById("pushToGitHubBtn")!;

    form.addEventListener("submit", this.saveConfig.bind(this));
    refreshButton.addEventListener("click", this.getBranches.bind(this));
    closeButton.addEventListener("click", () => emit("close"));
    getVariablesButton.addEventListener("click", () => emit("get-variables"));
    pushButton.addEventListener("click", this.pushToGitHub.bind(this));

    on("RECEIVE-CONFIG", this.handleConfigReceived.bind(this));
    on("TO-GITHUB", this.handlePushToGitHub.bind(this));
  }

  // Handle configuration received from Figma
  private handleConfigReceived(data: any) {
    this.config = {
      owner: data.owner,
      repo: data.repo,
      path: data.path,
      auth: data.auth,
      branch: data.branch,
    };

    // Populate input fields with received config data
    (document.getElementById("owner") as HTMLInputElement).value = this.config.owner;
    (document.getElementById("repo") as HTMLInputElement).value = this.config.repo;
    (document.getElementById("path") as HTMLInputElement).value = this.config.path;
    (document.getElementById("auth") as HTMLInputElement).value = this.config.auth;
    (document.getElementById("branch") as HTMLSelectElement).value = this.config.branch;

    this.initializeOctokit();
    this.getBranches();
  }

  // Save config when form is submitted
  private saveConfig(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    this.config = {
      owner: formData.get("owner") as string,
      repo: formData.get("repo") as string,
      path: formData.get("path") as string,
      auth: formData.get("auth") as string,
      branch: formData.get("branch") as string,
    };
    emit("save-config", this.config);
    this.setStatus("Configuration saved.");
  }

  // Fetch branches from GitHub
  private async getBranches() {
    this.initializeOctokit();
    if (!this.octokit || !this.config.owner || !this.config.repo) {
      this.setStatus("Owner, repo, or auth token missing.");
      return;
    }

    try {
      const defaultBranch = await this.getDefaultBranch();
      const { data } = await this.octokit.request("GET /repos/{owner}/{repo}/branches", {
        owner: this.config.owner,
        repo: this.config.repo,
      });

      this.branches = [defaultBranch, ...data.map((b: any) => b.name).filter((b: string) => b !== defaultBranch)];
      this.updateBranchSelect();
      this.setStatus("Branches updated.");
    } catch (error) {
      console.error("Error fetching branches:", error);
      this.setStatus("Error fetching branches.");
    }
  }

  // Get default branch of repository
  private async getDefaultBranch() {
    this.initializeOctokit();
    const { data } = await this.octokit.request("GET /repos/{owner}/{repo}", {
      owner: this.config.owner,
      repo: this.config.repo,
    });
    return data.default_branch;
  }

  // Update branch select dropdown
  private updateBranchSelect() {
    const branchSelect = document.getElementById("branch") as HTMLSelectElement;
    branchSelect.innerHTML = '<wa-option value="" disabled>Select branch</wa-option>';
    this.branches.forEach(branch => {
      const option = document.createElement("wa-option");
      option.value = branch;
      option.textContent = branch;
      branchSelect.appendChild(option);
    });
    branchSelect.value = this.config.branch || "";
  }

  // Push to GitHub
  private async pushToGitHub() {
    this.setStatus("Sending to GitHub...");
    this.initializeOctokit();

    try {
      const { updated, data } = await this.octokit.createOrUpdateTextFile({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path || "figma.json",
        branch: this.config.branch || "main",
        content: JSON.stringify(this.config),
        message: "Update Figma Variables",
      });

      if (updated) {
        this.setStatus(`Updated via ${data.commit.html_url}`);
      } else {
        this.setStatus("Already up to date.");
      }
    } catch (error) {
      console.error("Error pushing to GitHub:", error);
      this.setStatus("Error pushing to GitHub.");
    }
  }

  // Set status message
  private setStatus(message: string) {
    this.statusMessage.textContent = message;
  }

  // Handle push-to-GitHub event from Figma
  private handlePushToGitHub(content: string) {
    this.config.path = content;
    this.pushToGitHub();
  }
}

// Initialize the plugin
new GitHubSyncPlugin();
