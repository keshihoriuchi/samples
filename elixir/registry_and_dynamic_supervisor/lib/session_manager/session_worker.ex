defmodule SessionManager.SessionWorker do
  use GenServer, restart: :temporary

  # (Dynamic)Supervisor向けのAPI
  def start_link({k, v}) do
    name = {:via, Registry, {SessionManager.SessionRegistry, k}}
    GenServer.start_link(__MODULE__, {k, v}, name: name)
  end

  # 以下2つClient向けのAPI
  def get_value(pid) do
    GenServer.call(pid, :getvalue)
  end

  def stop(pid) do
    GenServer.cast(pid, :stop)
  end

  # 以下3つGenServerのコールバック実装
  @impl true
  def init({k, v}) do
    {:ok, {k, v}}
  end

  @impl true
  def handle_call(:getvalue, _from, {k, v}) do
    {:reply, v, {k, v}}
  end

  @impl true
  def handle_cast(:stop, state) do
    {:stop, :normal, state}
  end
end
