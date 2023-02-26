defmodule ChatApp.UserWorker do
  use GenServer, restart: :temporary
  alias ChatApp.ChatRoomWorker

  def start_link(pid) do
    GenServer.start_link(__MODULE__, %{pid: pid})
  end

  def join(pid, user_id) do
    GenServer.call(pid, {:join, user_id})
  end

  def send_msg(pid, msg) do
    GenServer.cast(pid, {:send_msg, msg})
  end

  def handle_msg(pid, from_id, msg) do
    GenServer.cast(pid, {:handle_msg, from_id, msg})
  end

  ## 以下GenServerコールバック

  @impl true
  def init(%{pid: pid}) do
    {:ok, %{pid: pid}}
  end

  @impl true
  def handle_call({:join, user_id}, _from, state) do
    :ok = ChatRoomWorker.join(self(), user_id)
    {:reply, :ok, Map.put(state, :user_id, user_id)}
  end

  @impl true
  def handle_cast({:send_msg, msg}, %{user_id: user_id} = state) do
    :ok = ChatRoomWorker.send_msg(user_id, msg)
    {:noreply, state}
  end

  @impl true
  def handle_cast({:handle_msg, from_id, msg}, %{pid: pid, user_id: user_id} = state) do
    send(pid, {user_id, from_id, msg})
    {:noreply, state}
  end
end
