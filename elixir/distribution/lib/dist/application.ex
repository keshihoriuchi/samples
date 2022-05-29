defmodule Dist.Application do
  @moduledoc false

  use Application
  require Logger

  @impl true
  def start(_type, _args) do
    children = [
      {DynamicSupervisor, name: Dist.DistSupervisor, strategy: :one_for_one},
      {Registry, keys: :unique, name: Dist.DistRegistry}
    ]

    Logger.info("start #{Node.self()}")

    opts = [strategy: :one_for_one, name: Dist.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
