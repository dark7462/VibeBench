package com.vibebench.model;

import com.fasterxml.jackson.annotation.JsonAlias;

public class BenchmarkRequest {
    @JsonAlias({ "model_name", "modelName" })
    private String modelName;

    @JsonAlias({ "apikey", "apiKey" })
    private String apikey;

    @JsonAlias({ "prompt/plan.md", "prompt\\plan.md", "plan.md text", "prompt" })
    private String prompt;

    @JsonAlias({ "reference_repo", "referenceRepo" })
    private String referenceRepo;

    public BenchmarkRequest() {}

    public BenchmarkRequest(String modelName, String apikey, String prompt, String referenceRepo) {
        this.modelName = modelName;
        this.apikey = apikey;
        this.prompt = prompt;
        this.referenceRepo = referenceRepo;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getApikey() {
        return apikey;
    }

    public void setApikey(String apikey) {
        this.apikey = apikey;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getReferenceRepo() {
        return referenceRepo;
    }

    public void setReferenceRepo(String referenceRepo) {
        this.referenceRepo = referenceRepo;
    }
}
