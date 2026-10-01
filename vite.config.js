import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const [repositoryOwner, repositoryName] = process.env.GITHUB_REPOSITORY?.split('/') ?? []
const isUserOrOrganizationSite = repositoryName?.toLowerCase() === `${repositoryOwner}.github.io`.toLowerCase()
const base = process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isUserOrOrganizationSite
  ? `/${repositoryName}/`
  : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
