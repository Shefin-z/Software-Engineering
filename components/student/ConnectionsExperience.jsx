import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Facebook,
  Instagram,
  LoaderCircle,
  MessageCircle,
  Phone,
  Search,
  Send,
  Trash2,
  Twitter,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { socialProfileHref } from "../../lib/socialProfiles";

const initials = (name) => String(name || "Student")
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

const profileLine = (student) => [student?.target_role, student?.university]
  .filter(Boolean)
  .join(" · ") || student?.degree || "CareerCube student";

const connectionSocialFields = [
  { key: "facebook_url", label: "Facebook", Icon: Facebook, tone: "facebook" },
  { key: "instagram_url", label: "Instagram", Icon: Instagram, tone: "instagram" },
  { key: "whatsapp", label: "WhatsApp", Icon: Phone, tone: "whatsapp" },
  { key: "twitter_url", label: "X / Twitter", Icon: Twitter, tone: "twitter" },
  { key: "telegram", label: "Telegram", Icon: Send, tone: "telegram" },
];

const displayTime = (value, withDate = false) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return withDate
    ? date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const sameConnection = (left, right) => left !== null && left !== undefined && left !== ""
  && right !== null && right !== undefined && right !== ""
  && String(left) === String(right);

function Avatar({ student, size = "h-10 w-10" }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-cobalt text-xs font-extrabold text-white ${size}`}>
      {student?.avatar ? <img src={student.avatar} alt="" className="h-full w-full object-cover" /> : initials(student?.name)}
    </span>
  );
}

function ConnectionSocialLinks({ student }) {
  const links = connectionSocialFields
    .map((item) => ({ ...item, href: socialProfileHref(item.key, student?.[item.key]) }))
    .filter((item) => item.href);
  if (!links.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Connected social profiles">
      {links.map(({ key, label, Icon, tone, href }) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={`clay-social-mini social-${tone} grid h-7 w-7 place-items-center rounded-lg`} aria-label={`Open ${student.name}'s ${label}`} title={label}><Icon size={13} /></a>
      ))}
    </div>
  );
}

function PersonResult({ student, onConnect, onAccept, onDecline, onCancel, onMessage, busyId }) {
  const status = student.connection_status || "none";
  const isBusy = Number(busyId) === Number(student.student_id) || sameConnection(busyId, student.connection_id);
  return (
    <article className="clay-list-item flex items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white/45 p-3 dark:bg-white/[0.035]">
      <Avatar student={student} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><b className="truncate text-sm">{student.name}</b><span className="tag !px-1.5 !py-0.5">ID {student.student_id}</span></div>
        <p className="mt-0.5 truncate text-xs text-muted">{profileLine(student)}</p>
      </div>
      {status === "none" && <button disabled={isBusy} onClick={() => onConnect(student)} className="btn-secondary min-h-9 shrink-0 px-3 text-xs disabled:opacity-50"><UserPlus size={14} /> Add</button>}
      {status === "outgoing" && <button disabled={isBusy} onClick={() => onCancel(student.connection_id)} className="btn-ghost min-h-9 shrink-0 px-2 text-xs text-muted disabled:opacity-50">Cancel</button>}
      {status === "incoming" && <div className="flex shrink-0 gap-1.5"><button disabled={isBusy} onClick={() => onAccept(student.connection_id)} className="btn-accent min-h-9 px-3 text-xs disabled:opacity-50"><Check size={14} /> Accept</button><button disabled={isBusy} onClick={() => onDecline(student.connection_id)} className="btn-secondary min-h-9 px-2 text-xs disabled:opacity-50" aria-label="Decline connection request" title="Decline request"><X size={14} /></button></div>}
      {status === "connected" && <button onClick={() => onMessage(student.connection_id)} className="btn-secondary min-h-9 shrink-0 px-3 text-xs"><MessageCircle size={14} /> Message</button>}
    </article>
  );
}

export default function ConnectionsPage({ search, setSearch, currentUser, notify }) {
  const [network, setNetwork] = useState({ connections: [], incomingRequests: [], unreadCount: 0 });
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [draft, setDraft] = useState("");
  const [busyStudentId, setBusyStudentId] = useState(null);
  const [busyRequestId, setBusyRequestId] = useState(null);
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const messageEndRef = useRef(null);

  const selectedConnection = useMemo(
    () => network.connections.find((connection) => sameConnection(connection.connection_id, selectedConnectionId)) || null,
    [network.connections, selectedConnectionId],
  );
  const trimmedSearch = String(search || "").trim();
  const canSearch = /^\d+$/.test(trimmedSearch) || trimmedSearch.length >= 2;

  const loadNetwork = async ({ quiet = false } = {}) => {
    if (!quiet) {
      setNetworkLoading(true);
      setNetworkError("");
    }
    try {
      const nextNetwork = await apiRequest("/network/connections");
      const connections = Array.isArray(nextNetwork.connections) ? nextNetwork.connections : [];
      setNetwork({
        connections,
        incomingRequests: Array.isArray(nextNetwork.incomingRequests) ? nextNetwork.incomingRequests : [],
        unreadCount: Number(nextNetwork.unreadCount || 0),
      });
      setSelectedConnectionId((current) => {
        if (connections.some((item) => sameConnection(item.connection_id, current))) return current;
        return connections[0]?.connection_id || null;
      });
      setNetworkError("");
    } catch (error) {
      if (!quiet) setNetworkError(error.message);
    } finally {
      if (!quiet) setNetworkLoading(false);
    }
  };

  const loadMessages = async (connectionId, { quiet = false } = {}) => {
    if (!connectionId) return;
    if (!quiet) {
      setMessagesLoading(true);
      setMessageError("");
    }
    try {
      const nextMessages = await apiRequest(`/network/conversations/${connectionId}/messages`);
      setMessages(Array.isArray(nextMessages) ? nextMessages : []);
      setMessageError("");
    } catch (error) {
      if (!quiet) setMessageError(error.message);
    } finally {
      if (!quiet) setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork();
    const timer = window.setInterval(() => loadNetwork({ quiet: true }), 12000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!canSearch) {
      setSearchResults([]);
      setSearchError("");
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");
      try {
        const results = await apiRequest(`/network/students?q=${encodeURIComponent(trimmedSearch)}`);
        if (!cancelled) setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        if (!cancelled) setSearchError(error.message);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedSearch, canSearch]);

  useEffect(() => {
    if (!selectedConnectionId) {
      setMessages([]);
      return undefined;
    }
    loadMessages(selectedConnectionId);
    const timer = window.setInterval(() => loadMessages(selectedConnectionId, { quiet: true }), 7000);
    return () => window.clearInterval(timer);
  }, [selectedConnectionId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, selectedConnectionId]);

  const sendRequest = async (student) => {
    setBusyStudentId(student.student_id);
    try {
      const result = await apiRequest("/network/connections", {
        method: "POST",
        body: JSON.stringify({ studentId: student.student_id }),
      });
      notify(result.message);
      await Promise.all([loadNetwork({ quiet: true }), canSearch ? apiRequest(`/network/students?q=${encodeURIComponent(trimmedSearch)}`).then(setSearchResults) : Promise.resolve()]);
      if (result.status === "accepted") setSelectedConnectionId(result.id);
    } catch (error) {
      notify(error.message);
    } finally {
      setBusyStudentId(null);
    }
  };

  const respondToRequest = async (connectionId, action) => {
    setBusyRequestId(connectionId);
    try {
      const result = await apiRequest(`/network/connections/${connectionId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      notify(result.message);
      await loadNetwork({ quiet: true });
      if (result.status === "accepted") setSelectedConnectionId(result.id);
      if (canSearch) {
        const results = await apiRequest(`/network/students?q=${encodeURIComponent(trimmedSearch)}`);
        setSearchResults(results);
      }
    } catch (error) {
      notify(error.message);
    } finally {
      setBusyRequestId(null);
    }
  };

  const cancelRequest = async (connectionId) => {
    setBusyStudentId(connectionId);
    try {
      const result = await apiRequest(`/network/connections/${connectionId}`, { method: "DELETE" });
      notify(result.message);
      await loadNetwork({ quiet: true });
      if (canSearch) {
        const results = await apiRequest(`/network/students?q=${encodeURIComponent(trimmedSearch)}`);
        setSearchResults(results);
      }
    } catch (error) {
      notify(error.message);
    } finally {
      setBusyStudentId(null);
    }
  };

  const removeConnection = async () => {
    if (!selectedConnection || !window.confirm(`Remove ${selectedConnection.name} from your connections?`)) return;
    try {
      const result = await apiRequest(`/network/connections/${selectedConnection.connection_id}`, { method: "DELETE" });
      notify(result.message);
      setSelectedConnectionId(null);
      setMessages([]);
      await loadNetwork({ quiet: true });
    } catch (error) {
      notify(error.message);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedConnection || sending) return;
    setSending(true);
    try {
      const message = await apiRequest(`/network/conversations/${selectedConnection.connection_id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages((current) => [...current, message]);
      setDraft("");
      loadNetwork({ quiet: true });
    } catch (error) {
      notify(error.message);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (message) => {
    if (!selectedConnection || !window.confirm("Delete this message for everyone?")) return;
    setDeletingMessageId(message.id);
    try {
      const result = await apiRequest(`/network/conversations/${selectedConnection.connection_id}/messages/${message.id}`, { method: "DELETE" });
      setMessages((current) => current.filter((item) => Number(item.id) !== Number(message.id)));
      notify(result.message);
      loadNetwork({ quiet: true });
    } catch (error) {
      notify(error.message);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const clearHistory = async () => {
    if (!selectedConnection || !messages.length || !window.confirm(`Clear the full chat history with ${selectedConnection.name}? This removes the messages for both students.`)) return;
    setClearingHistory(true);
    try {
      const result = await apiRequest(`/network/conversations/${selectedConnection.connection_id}/messages`, { method: "DELETE" });
      setMessages([]);
      notify(result.message);
      loadNetwork({ quiet: true });
    } catch (error) {
      notify(error.message);
    } finally {
      setClearingHistory(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="clay-accent-panel overflow-hidden rounded-[28px] bg-ink px-6 py-7 text-white shadow-lift sm:px-8">
        <div className="max-w-2xl"><span className="eyebrow !text-[#AFC0FF]"><Users size={13} /> Student network</span><h2 className="mt-3 text-2xl font-extrabold tracking-[-0.045em] sm:text-3xl">Find your people. Build your career circle.</h2><p className="mt-3 text-sm leading-6 text-white/65">Search verified CareerCube students by name or student ID, connect when they accept, then message privately.</p></div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(320px,.86fr)_minmax(0,1.35fr)]">
        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between"><div><h2 className="font-extrabold">Find students</h2><p className="mt-1 text-xs text-muted">Name, university, role, or student ID</p></div><Search className="text-cobalt" size={19} /></div>
            <label className="relative mt-4 block"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input min-h-11 pl-10" placeholder="Search by student ID or name" aria-label="Search students" /></label>
            {!trimmedSearch && <p className="mt-4 rounded-2xl bg-cobalt/8 p-3 text-xs leading-5 text-cobalt">Tip: type a student ID for an exact match, or at least two letters to search by name.</p>}
            {trimmedSearch && !canSearch && <p className="mt-4 text-xs text-muted">Type at least two letters, or a numeric student ID.</p>}
            {searchLoading && <p className="mt-5 flex items-center gap-2 text-xs text-muted"><LoaderCircle size={15} className="animate-spin" /> Searching students...</p>}
            {searchError && <p className="mt-4 rounded-xl bg-coral/10 p-3 text-xs font-bold text-coral">{searchError}</p>}
            {!searchLoading && canSearch && !searchError && !searchResults.length && <p className="mt-5 rounded-2xl bg-ink/[0.035] p-4 text-xs leading-5 text-muted dark:bg-white/[0.04]">No active students matched “{trimmedSearch}”. Check the student ID or try a different name.</p>}
            <div className="mt-4 space-y-3">{searchResults.map((student) => <PersonResult key={student.student_id} student={student} onConnect={sendRequest} onAccept={(id) => respondToRequest(id, "accept")} onDecline={(id) => respondToRequest(id, "decline")} onCancel={cancelRequest} onMessage={setSelectedConnectionId} busyId={busyStudentId || busyRequestId} />)}</div>
          </div>

          {!networkLoading && network.incomingRequests.length > 0 && <div className="panel p-5"><div className="flex items-center justify-between"><h2 className="font-extrabold">Connection requests</h2><span className="tag !text-coral">{network.incomingRequests.length} new</span></div><div className="mt-4 space-y-3">{network.incomingRequests.map((student) => <article key={student.connection_id} className="clay-list-item rounded-2xl bg-ink/[0.035] p-3 dark:bg-white/[0.04]"><div className="flex items-center gap-3"><Avatar student={student} /><div className="min-w-0 flex-1"><b className="block truncate text-sm">{student.name}</b><p className="truncate text-xs text-muted">{profileLine(student)} · ID {student.student_id}</p></div></div><div className="mt-3 flex gap-2"><button disabled={sameConnection(busyRequestId, student.connection_id)} onClick={() => respondToRequest(student.connection_id, "accept")} className="btn-accent min-h-9 flex-1 text-xs disabled:opacity-50"><Check size={14} /> Accept</button><button disabled={sameConnection(busyRequestId, student.connection_id)} onClick={() => respondToRequest(student.connection_id, "decline")} className="btn-secondary min-h-9 px-3 text-xs disabled:opacity-50"><X size={14} /> Ignore</button></div></article>)}</div></div>}

          <div className="panel p-5"><div className="flex items-center justify-between"><h2 className="font-extrabold">Your connections</h2><span className="tag !text-jade">{network.connections.length}</span></div>{networkLoading && <p className="mt-4 flex items-center gap-2 text-xs text-muted"><LoaderCircle className="animate-spin" size={15} /> Loading your inbox...</p>}{networkError && <div className="mt-4 rounded-2xl bg-coral/10 p-3 text-xs text-coral"><AlertTriangle className="mb-2" size={16} />{networkError}<button onClick={() => loadNetwork()} className="mt-2 block font-extrabold underline">Try again</button></div>}{!networkLoading && !networkError && !network.connections.length && <p className="mt-4 text-xs leading-5 text-muted">Your accepted connections will appear here. Search for a student to send the first request.</p>}<div className="mt-4 space-y-1">{network.connections.map((connection) => <button key={connection.connection_id} onClick={() => setSelectedConnectionId(connection.connection_id)} className={`clay-connection-item flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${sameConnection(selectedConnectionId, connection.connection_id) ? "is-selected bg-cobalt text-white shadow-lg" : "hover:bg-ink/[0.045] dark:hover:bg-white/[0.05]"}`}><Avatar student={connection} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><b className="truncate text-sm">{connection.name}</b>{Number(connection.unread_count || 0) > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-extrabold ${sameConnection(selectedConnectionId, connection.connection_id) ? "bg-white text-cobalt" : "bg-coral text-white"}`}>{connection.unread_count}</span>}</span><small className={`mt-0.5 block truncate ${sameConnection(selectedConnectionId, connection.connection_id) ? "text-white/65" : "text-muted"}`}>{connection.last_message || profileLine(connection)}</small></span></button>)}</div></div>
        </aside>

        <section className="clay-chat-shell panel flex min-h-[620px] flex-col overflow-hidden p-0">
          {!selectedConnection && <div className="m-auto max-w-sm px-6 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-cobalt/10 text-cobalt"><MessageCircle size={28} /></span><h2 className="mt-5 text-xl font-extrabold">Your private inbox</h2><p className="mt-2 text-sm leading-6 text-muted">Accept a connection request or add a student to start a direct conversation.</p></div>}
          {selectedConnection && <>
            <header className="clay-chat-header flex items-center gap-3 border-b border-ink/[0.07] bg-white/45 px-5 py-4 dark:bg-white/[0.025]">
              <Avatar student={selectedConnection} size="h-11 w-11" />
              <div className="min-w-0 flex-1"><h2 className="truncate font-extrabold">{selectedConnection.name}</h2><p className="truncate text-xs text-muted">{profileLine(selectedConnection)} · Student ID {selectedConnection.student_id}</p><ConnectionSocialLinks student={selectedConnection} /></div>
              <div className="flex shrink-0 items-center gap-1">
                <button disabled={!messages.length || clearingHistory} onClick={clearHistory} className="btn-ghost min-h-9 px-2 text-xs text-muted hover:text-coral disabled:opacity-45">{clearingHistory ? <LoaderCircle size={14} className="animate-spin" /> : "Clear history"}</button>
                <button onClick={removeConnection} className="btn-ghost min-h-9 px-2 text-xs text-muted hover:text-coral">Remove</button>
              </div>
            </header>
            <div className="clay-chat-well flex-1 space-y-3 overflow-y-auto bg-canvas/45 px-5 py-5">
              {messagesLoading && <p className="flex items-center justify-center gap-2 pt-12 text-xs text-muted"><LoaderCircle size={16} className="animate-spin" /> Loading conversation...</p>}
              {messageError && <div className="mx-auto max-w-md rounded-2xl bg-coral/10 p-4 text-center text-xs text-coral"><AlertTriangle className="mx-auto mb-2" size={17} />{messageError}<button onClick={() => loadMessages(selectedConnection.connection_id)} className="mt-2 block w-full font-extrabold underline">Try again</button></div>}
              {!messagesLoading && !messageError && !messages.length && <div className="mx-auto max-w-sm pt-20 text-center"><MessageCircle className="mx-auto text-cobalt/60" size={25} /><p className="mt-3 text-sm font-bold">Say hello to {selectedConnection.name.split(" ")[0]}.</p><p className="mt-1 text-xs text-muted">Your messages are private to this connection.</p></div>}
              {messages.map((message) => {
                const mine = Number(message.sender_id) === Number(currentUser.id);
                const deleting = Number(deletingMessageId) === Number(message.id);
                return <div key={message.id} className={`flex items-center gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                  {mine && <button disabled={deleting} onClick={() => deleteMessage(message)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-coral/10 hover:text-coral disabled:opacity-45" aria-label="Delete this message" title="Delete this message">{deleting ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>}
                  <div className={`clay-message max-w-[82%] rounded-[18px] px-4 py-3 text-sm shadow-sm ${mine ? "clay-message-outgoing rounded-br-md bg-cobalt text-white" : "clay-message-incoming rounded-bl-md bg-[#EEF2FF] text-[#172033] dark:bg-[#293044] dark:text-white"}`}><p className="whitespace-pre-wrap break-words leading-6">{message.body}</p><small className={`mt-1.5 block text-[10px] ${mine ? "text-white/60" : "text-[#566176] dark:text-white/70"}`}>{displayTime(message.created_at, true)}{mine && message.read_at ? " · Seen" : ""}</small></div>
                </div>;
              })}
              <div ref={messageEndRef} />
            </div>
            <form onSubmit={sendMessage} className="clay-chat-composer border-t border-ink/[0.07] bg-white/45 p-4 dark:bg-white/[0.025]">
              <div className="flex items-end gap-3"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="input min-h-11 max-h-32 flex-1 resize-y py-2.5" maxLength={2000} placeholder={`Message ${selectedConnection.name.split(" ")[0]}...`} aria-label="Write a message" /><button disabled={!draft.trim() || sending} className="btn-accent min-h-11 px-4 disabled:opacity-45" aria-label="Send message">{sending ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={16} />}</button></div>
              <p className="mt-2 text-[10px] text-muted">Press Enter in this box to send a line break, or use the send button.</p>
            </form>
          </>}
        </section>
      </section>
    </div>
  );
}
