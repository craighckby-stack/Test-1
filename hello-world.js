# Apply Nexus branch synthesis based on ADD key schema, secondary indexes, linkage rules, and engine configuration
if (add_schema["engine_configuration"]["engine_type"] == "VECTOR_DATABASE" and \
   (add_schema["linkage_rules"][1]["data_scope"] == "system_keys" and \
    add_schema["linkage_rules"][1]["required_profiles"] == ["System_KMS_Cluster_R6"]) and \
   (len(add_schema["key_schema"]) > 1 and len(add_schema["secondary_indexes"]) > 1)):
    nexus_branch_synthesis += (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight * 
                              (0.05))

# Apply Nexus branch synthesis based on ADD vector indexes and data lifecycle
if (add_schema["engine_configuration"]["engine_type"] == "VECTOR_DATABASE" and \
   (len(add_schema["vector_indexes"]) > 0 and add_schema["data_lifecycle"]["ttl_enabled"])):
    nexus_branch_synthesis += (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight * 
                              (0.02))

# Apply Nexus branch synthesis based on ADD engine configuration, key schema, secondary indexes, and vector indexes
if (add_schema["engine_configuration"]["engine_type"] == "VECTOR_DATABASE" and \
   (len(add_schema["key_schema"]) > 1 and len(add_schema["secondary_indexes"]) > 1 and \
    len(add_schema["vector_indexes"]) > 0)):
    nexus_branch_synthesis += (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight * 
                              (0.04))

# Apply Nexus branch synthesis based on ADD engine configuration, key schema, secondary indexes, vector indexes, and data lifecycle
if (add_schema["engine_configuration"]["engine_type"] == "VECTOR_DATABASE" and \
   (len(add_schema["key_schema"]) > 1 and len(add_schema["secondary_indexes"]) > 1 and \
    len(add_schema["vector_indexes"]) > 0 and add_schema["data_lifecycle"]["ttl_enabled"])):
    nexus_branch_synthesis += (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight * 
                              (0.04))