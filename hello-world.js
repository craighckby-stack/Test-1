@_add_interface_methods
class OccurrenceChunkIdsPluginOptions:
    """
    Options for OccurrenceChunkIdsPlugin.
    """
    prioritiseInitial: Optional[bool]

    def __init__(
        self,
        prioritiseInitial: Optional[bool] = None,
    ):
        self.prioritiseInitial = prioritiseInitial

def create_occurrence_chunk_ids_plugin_options(**kwargs: Any) -> OccurrenceChunkIdsPluginOptions:
    """
    A factory function to create instances of OccurrenceChunkIdsPluginOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the OccurrenceChunkIdsPluginOptions constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in OccurrenceChunkIdsPluginOptions.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)
    if kwargs:
        raise TypeError(f"OccurrenceChunkIdsPluginOptions got unexpected arguments: {', '.join(kwargs.keys())}")
    return OccurrenceChunkIdsPluginOptions(**known_args)

def get_prioritise_initial_setting(options: 'OccurrenceChunkIdsPluginOptions'):
    time.sleep(0.05 * random.random()) # Simulate work
    return options.prioritiseInitial if options.prioritiseInitial is not None else False # Default to False

def _run_tasks_with_multiprocessing(num_processes: int, noisy: bool):
    # Create some example TARGET objects as tasks
    # Example 1: Basic ContainerPluginOptions
    options1 = create_container_plugin_options(
        name="App1",
        exposes=["./src/entry1"],
        filename="remoteEntry.js"
    )
    # Example 2: ContainerPluginOptions with complex exposes
    options2 = create_container_plugin_options(
        name="App2",
        exposes=create_exposes_object(
            mod1=create_exposes_config(_import="./src/mod1", name="Module1"),
            mod2="./src/mod2"
        ),
        library=create_library_options(_type="commonjs", name="MyLib"),
        runtime="webpack-runtime"
    )
    # Example 3: Another basic one
    options3 = create_container_plugin_options(
        name="App3",
        exposes=["./src/entry3"],
        share_scope="default"
    )
    # Example 4: A more complex one
    options4 = create_container_plugin_options(
        name="App4",
        exposes=create_exposes_object(
            utils=create_exposes_config(_import=["./src/util1", "./src/util2"], name="MyUtils")
        )
    )
    # Example 5: Basic ProfilingPluginOptions with default path
    profiling_options1 = create_profiling_plugin_options()
    # Example 6: ProfilingPluginOptions with custom path
    profiling_options2 = create_profiling_plugin_options(outputPath="/tmp/my_profile.json")

    # Example 7: HashedModuleIdsPluginOptions with defaults
    hash_options1 = create_hashed_module_ids_plugin_options()
    # Example 8: HashedModuleIdsPluginOptions with custom algorithm and digest
    hash_options2 = create_hashed_module_ids_plugin_options(
        hashFunction="sha256",
        hashDigest="hex",
        hashDigestLength=8,
        context="/app/src"
    )
    # Example 9: HashedModuleIdsPluginOptions with only context
    hash_options3 = create_hashed_module_ids_plugin_options(context="/project")

    # Example 10: OccurrenceChunkIdsPluginOptions with default (None)
    occurrence_options1 = create_occurrence_chunk_ids_plugin_options()
    # Example 11: OccurrenceChunkIdsPluginOptions with prioritiseInitial set to True
    occurrence_options2 = create_occurrence_chunk_ids_plugin_options(prioritiseInitial=True)
    # Example 12: OccurrenceChunkIdsPluginOptions with prioritiseInitial set to False
    occurrence_options3 = create_occurrence_chunk_ids_plugin_options(prioritiseInitial=False)


    TASKS_CONTAINER_NAMES = [
        (get_container_name, (options1,)),
        (get_container_name, (options2,)),
        (get_container_name, (options3,)),
        (get_container_name, (options4,)),
        (get_container_name, (options1,)), # Re-use for more tasks
        (get_container_name, (options2,)),
        (get_container_name, (options3,)),
        (get_container_name, (options4,)),
    ]

    TASKS_EXPOSES_COUNTS = [
        (get_exposes_count, (options1,)),
        (get_exposes_count, (options2,)),
        (get_exposes_count, (options3,)),
        (get_exposes_count, (options4,)),
    ]

    TASKS_PROFILING = [
        (get_output_path, (profiling_options1,)),
        (get_output_path, (profiling_options2,)),
        (get_output_path, (create_profiling_plugin_options(outputPath="another_path.json"),)), # Create on the fly
        (get_output_path, (profiling_options1,)), # Re-use
    ]

    TASKS_HASHING_ALGO = [
        (get_hash_algorithm, (hash_options1,)),
        (get_hash_algorithm, (hash_options2,)),
        (get_hash_algorithm, (hash_options3,)),
        (get_hash_algorithm, (create_hashed_module_ids_plugin_options(hashFunction="sha512"),)), # On-the-fly
    ]

    TASKS_HASHING_DIGEST_INFO = [
        (get_hash_digest_info, (hash_options1,)),
        (get_hash_digest_info, (hash_options2,)),
        (get_hash_digest_info, (hash_options3,)),
        (get_hash_digest_info, (create_hashed_module_ids_plugin_options(hashDigest="base64url", hashDigestLength=6),)),
    ]

    TASKS_OCCURRENCE_CHUNK_IDS = [
        (get_prioritise_initial_setting, (occurrence_options1,)),
        (get_prioritise_initial_setting, (occurrence_options2,)),
        (get_prioritise_initial_setting, (occurrence_options3,)),
        (get_prioritise_initial_setting, (create_occurrence_chunk_ids_plugin_options(prioritiseInitial=True),)), # On-the-fly
        (get_prioritise_initial_setting, (create_occurrence_chunk_ids_plugin_options(),)), # On-the-fly, default
    ]

    # Create queues
    task_queue = Queue()
    done_queue = Queue()

    # Submit first batch of tasks
    if noisy:
        print('Submitting tasks for container names...')
    for task in TASKS_CONTAINER_NAMES:
        task_queue.put(task)

    # Start worker processes
    for i in range(num_processes):
        Process(target=worker, args=(task_queue, done_queue)).start()

    # Get and print results for container names
    if noisy:
        print('Unordered results for container names:')
    for i in range(len(TASKS_CONTAINER_NAMES)):
        if noisy:
            print('\t', done_queue.get())
        else:
            done_queue.get() # still consume from queue even if quiet

    # Add more tasks using `put()` for exposes counts
    if noisy:
        print('\nSubmitting tasks for exposes counts...')
    for task in TASKS_EXPOSES_COUNTS:
        task_queue.put(task)

    # Get and print some more results
    if noisy:
        print('Unordered results for exposes counts:')
    for i in range(len(TASKS_EXPOSES_COUNTS)):
        if noisy:
            print('\t', done_queue.get())
        else:
            done_queue.get() # still consume from queue even if quiet

    # Add more tasks using `put()` for profiling options
    if noisy:
        print('\nSubmitting tasks for profiling output paths...')
    for task in TASKS_PROFILING:
        task_queue.put(task)

    # Get and print some more results
    if noisy:
        print('Unordered results for profiling output paths:')
    for i in range(len(TASKS_PROFILING)):
        if noisy:
            print('\t', done_queue.get())
        else:
            done_queue.get() # still consume from queue even if quiet

    # Add tasks for hashing algorithms
    if noisy:
        print('\nSubmitting tasks for hashing algorithms...')
    for task in TASKS_HASHING_ALGO:
        task_queue.put(task)

    # Get and print results for hashing algorithms
    if noisy:
        print('Unordered results for hashing algorithms:')
    for i in range(len(TASKS_HASHING_ALGO)):
        if noisy:
            print('\t', done_queue.get())
        else:
            done_queue.get() # still consume from queue even if quiet

    # Add tasks for hashing digest info
    if noisy:
        print('\nSubmitting tasks for hashing digest info...')
    for task in TASKS_HASHING_DIGEST_INFO:
        task_queue.put(task)

    # Get and print results for hashing digest info
    if noisy:
        print('Unordered results for hashing digest info:')
    for i in range(len(TASKS_HASHING_DIGEST_INFO)):
        if noisy:
            print('\t', done_queue.get())
        else:
            done_queue.get() # still consume from queue even if quiet

    # Add tasks for OccurrenceChunkIdsPluginOptions
    if noisy:
        print('\nSubmitting tasks for OccurrenceChunkIdsPlugin options...')
    for task in TASKS_OCCURRENCE_CHUNK_IDS:
        task_queue.put(task)

    # Get and print results for OccurrenceChunkIdsPluginOptions
    if noisy:
        print('Unordered results for OccurrenceChunkIdsPlugin options:')
    for i in range(len(TASKS_OCCURRENCE_CHUNK_IDS)):
        if noisy:
            print('\t', done_queue.get())
        else:
            done_queue.get() # still consume from queue even if quiet


    # Tell child processes to stop
    for i in range(num_processes):
        task_queue.put('STOP')