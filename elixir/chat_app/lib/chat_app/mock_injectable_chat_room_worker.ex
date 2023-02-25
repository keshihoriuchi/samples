defmodule ChatApp.MockInjectableChatRoomWorker do
  alias ChatApp.UserWorker
  use GenServer
  require Logger

  def start_link({:test, user_mod}) do
    {:ok, _pid} = GenServer.start_link(__MODULE__, %{user_mod: user_mod})
  end

  def start_link(_arg) do
    {:ok, _pid} = GenServer.start_link(__MODULE__, %{user_mod: UserWorker}, name: __MODULE__)
  end

  def join(pid, user_id) do
    GenServer.call(__MODULE__, {:join, pid, user_id})
  end

  def send_msg(from_id, msg) do
    GenServer.cast(__MODULE__, {:send_msg, from_id, msg})
  end

  @impl true
  def init(%{user_mod: user_mod}) do
    {:ok, %{users: %{}, user_mod: user_mod}}
  end

  ## 以下GenServerコールバック

  @impl true
  def handle_call({:join, pid, user_id}, _from, %{users: users} = state) do
    ref = Process.monitor(pid)
    {:reply, :ok, %{state | users: Map.put(users, ref, {pid, user_id})}}
  end

  @impl true
  def handle_cast({:send_msg, from_id, msg}, %{users: users, user_mod: user_mod} = state) do
    Enum.each(users, fn {_ref, {pid, to_id}} ->
      if from_id != to_id do
        user_mod.handle_msg(pid, from_id, msg)
      end
    end)

    {:noreply, state}
  end

  @impl true
  def handle_info({:DOWN, ref, :process, _pid, _msg}, %{users: users} = state) do
    {:noreply, %{state | users: Map.delete(users, ref)}}
  end
end
