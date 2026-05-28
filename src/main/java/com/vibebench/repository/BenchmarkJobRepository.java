package com.vibebench.repository;

import com.vibebench.model.BenchmarkJob;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BenchmarkJobRepository extends MongoRepository<BenchmarkJob, String> {
    List<BenchmarkJob> findByModelName(String modelName);
}
