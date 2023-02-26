defmodule ChatAppTest do
  use ExUnit.Case
  require Logger
  alias ChatApp.ChatRoomWorker
  alias ChatApp.UserWorker
  alias ChatApp.MockInjectableChatRoomWorker

  defmodule UserMock do
    def handle_msg(pid, from_id, msg) do
      send(pid, {:mock, from_id, msg})
    end
  end

  describe "Applicationの子孫としてGenServerを起動パターン" do
    test "User1 が ChatRoom に send_msg でメッセージを送ると User2 は ChatRoom から handle_msg で User1 が送ったメッセージを受信する" do
      {:ok, pid1} = UserWorker.start_link(self())
      :ok = UserWorker.join(pid1, "user1")

      {:ok, pid2} = UserWorker.start_link(self())
      :ok = UserWorker.join(pid2, "user2")

      UserWorker.send_msg(pid1, "hello")

      assert_receive({"user2", "user1", "hello"})
    end
  end

  describe "ExUnitの子としてGenServerを起動パターン" do
    test "User1 が ChatRoom に send_msg でメッセージを送ると User2 は ChatRoom から handle_msg で User1 が送ったメッセージを受信する" do
      {:ok, room_pid} = GenServer.start_link(ChatRoomWorker, %{})
      :ok = GenServer.call(room_pid, {:join, self(), "user1"})
      :ok = GenServer.call(room_pid, {:join, self(), "user2"})

      :ok = GenServer.cast(room_pid, {:send_msg, "user1", "hello"})
      assert_receive({:"$gen_cast", {:handle_msg, "user1", "hello"}})
    end
  end

  describe "コールバックを直接呼ぶパターン" do
    test "User1 が ChatRoom に send_msg でメッセージを送ると User2 は ChatRoom から handle_msg で User1 が送ったメッセージを受信する" do
      assert {:noreply, %{users: %{}}} =
               ChatRoomWorker.handle_cast(
                 {:send_msg, "user1", "hello"},
                 %{users: %{ref_dummy: {self(), "user2"}}}
               )

      assert_receive({:"$gen_cast", {:handle_msg, "user1", "hello"}})
    end
  end

  describe "ExUnitの子としてGenServerを起動パターン (モック差込版)" do
    test "User1 が ChatRoom に send_msg でメッセージを送ると User2 は ChatRoom から handle_msg で User1 が送ったメッセージを受信する" do
      {:ok, room_pid} = GenServer.start_link(MockInjectableChatRoomWorker, %{user_mod: UserMock})
      :ok = GenServer.call(room_pid, {:join, self(), "user1"})
      :ok = GenServer.call(room_pid, {:join, self(), "user2"})

      :ok = GenServer.cast(room_pid, {:send_msg, "user1", "hello"})
      assert_receive({:mock, "user1", "hello"})
    end
  end

  describe "コールバックを直接呼ぶパターン (モック差込版)" do
    test "User1 が ChatRoom に send_msg でメッセージを送ると User2 は ChatRoom から handle_msg で User1 が送ったメッセージを受信する" do
      assert {:noreply, %{users: %{}}} =
               MockInjectableChatRoomWorker.handle_cast(
                 {:send_msg, "user1", "hello"},
                 %{users: %{ref_dummy: {self(), "user2"}}, user_mod: UserMock}
               )

      assert_receive({:mock, "user1", "hello"})
    end
  end
end
