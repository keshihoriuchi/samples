defmodule Dist.DistWorker do
  use GenServer, restart: :temporary

  def start_link({k, v}) do
    name = {:via, Registry, {Dist.DistRegistry, k}}
    GenServer.start_link(__MODULE__, {k, v}, name: name)
  end

  def get_value(pid) do
    GenServer.call(pid, :getvalue)
  end

  @impl true
  def init({k, v}) do
    {:ok, {k, v}}
  end

  @impl true
  def handle_call(:getvalue, _from, {k, v}) do
    {:reply, v, {k, v}}
  end
end
