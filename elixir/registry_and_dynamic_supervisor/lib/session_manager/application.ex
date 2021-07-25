defmodule SessionManager.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {DynamicSupervisor, name: SessionManager.SessionSupervisor, strategy: :one_for_one},
      {Registry, keys: :unique, name: SessionManager.SessionRegistry}
    ]

    opts = [strategy: :one_for_one, name: SessionManager.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
