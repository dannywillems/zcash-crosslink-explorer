.PHONY: help
help: ## Ask for help!
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' \
		$(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; \
		{printf "\033[36m%-30s\033[0m %s\n", \
		$$1, $$2}'

.PHONY: setup
setup: ## Setup development environment
	npm install

.PHONY: dev
dev: ## Run SvelteKit dev server
	npx vite dev

.PHONY: build
build: ## Build for production
	npx vite build

.PHONY: build-release
build-release: ## Build for production (GH Pages)
	BASE_PATH=/zcash-crosslink-explorer npx vite build

.PHONY: preview
preview: ## Preview production build
	npx vite preview

.PHONY: check
check: check-format typecheck build ## Run all checks

.PHONY: typecheck
typecheck: ## Run svelte-check type checker
	npx svelte-kit sync && \
		npx svelte-check --tsconfig ./tsconfig.json

.PHONY: check-format
check-format: ## Check code formatting
	npx prettier --check .

.PHONY: format
format: ## Format code
	npx prettier --write .

.PHONY: lint
lint: check-format typecheck lint-docker ## Run all linters

.PHONY: lint-shell
lint-shell: ## Lint shell scripts using shellcheck
	@if compgen -G ".github/scripts/*.sh" \
		> /dev/null 2>&1; then \
		shellcheck .github/scripts/*.sh; \
	else \
		echo "No shell scripts to check"; \
	fi

.PHONY: lint-docker
lint-docker: ## Lint Dockerfile using hadolint
	hadolint Dockerfile

.PHONY: clean
clean: ## Clean build artifacts
	rm -rf build .svelte-kit node_modules

.PHONY: docker-build
docker-build: ## Build Docker image
	docker build -t zcash-crosslink-explorer .

.PHONY: docker-run
docker-run: ## Run Docker container
	docker run -p 8080:8080 zcash-crosslink-explorer
