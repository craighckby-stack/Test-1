if (!state.booted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <Brain className="text-blue-500 mb-6" size={48} />
          <h1 className="text-3xl font-bold text-white tracking-tighter italic">AGI-KERNEL <span className="text-blue-500">v7.2.0</span></h1>
        </div>
        <div className="space-y-4">
          <input type="password" placeholder="GitHub Token" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Repo (user/repo)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
            <input type="text" placeholder="Branch" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.branch} onChange={e => setInput({...input, branch: e.target.value})} />
          </div>
          <input type="text" placeholder="Path (e.g. storage/kernel.js)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.path} onChange={e => setInput({...input, path: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs appearance-none" value={input.provider} onChange={e => {
              const newProvider = e.target.value;
              let defaultModel = input.model;

              if (newProvider === 'gemini') {
                defaultModel = 'gemini-2.5-flash-preview-09-2025';
              } else if (newProvider === 'cerebras') {
                defaultModel = 'llama-3.3-70b';
              }

              setInput({...input, provider: newProvider, model: defaultModel});
            }}>
              <option value="gemini">Gemini</option>
              <option value="cerebras">Cerebras</option>
            </select>
            <input type="password" placeholder="API Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500" value={input.apiKey} onChange={e => setInput({...input, apiKey: e.target.value})} />
          </div>
        </div>
      </div>
    </div>
  );