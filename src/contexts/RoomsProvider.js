import React, { useState, useContext, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useContacts } from './ContactsProvider';

/**
 * 채팅방에 필요한 데이터 저장, 처리를 위한 클래스
 * @class
 * @typedef Room
 * @type {object}
 * @property {number} roomId - 고유 채팅방 ID. 채팅방 생성시 자동 설정, 생성 후에는 변경 불가
 * @property {string} roomName - 채팅방 이름. 사용자가 생성시 설정
 * @property {Array.User} participants - 참여하고 있는 사용자 배열
 * @property {Array.Chat} chats - 해당 채팅방의 채팅 배열
 * @property {Array.object} lastReadTime - 유저별 마지막으로 읽은 시각 저장. 안 읽은 메세지 계산용으로 사용
 * @namespace
 * @property {string} lastReadTime.userId
 * @property {object} lastReadTime.time - 해당 유저가 마지막으로 읽은 시각.
 * @property {Array.User} connectedUsers - 현재 채팅방에 접속해서 읽고 있는 유저 (마지막으로 읽은 시각 자동 처리용)
 */
class Room {
  constructor(
    roomName,
    participants,
    roomId,
    chats,
    lastReadTime,
    connectedUsers
  ) {
    const d = new Date();
    if (roomId) {
      this.roomId = roomId;
    } else {
      this.roomId = d.getTime(); // Number
    }

    this.roomName = roomName; // String
    this.participants = participants; // Array Users

    if (chats) {
      this.chats = chats;
    } else {
      this.chats = participants.map((user) => new Chat('enter', user, '')); // Array Chats
    }

    if (lastReadTime) {
      this.lastReadTime = lastReadTime;
    } else {
      this.lastReadTime = []; // Array { userId: Number(User.userId), time: Date }
    }

    if (connectedUsers) {
      this.connectedUsers = connectedUsers;
    } else {
      this.connectedUsers = []; // Array Numbers (User.userId)
    }
  }

  /**
   * 해당 유저가 채팅방에 초대되어 있는지 여부를 반환
   * @method isUserInRoom
   * @param {string} userId 
   * @returns {boolean} 유저가 채팅방에 초대되어 있으면 true, 초대되어 있지 않으면 false
   */
  isUserInRoom(userId) {
    for (let i = 0; i < this.participants.length; i++) {
      if (this.participants[i].userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * 채팅방에 사용자 초대
   * @method enterRoom
   * @param {User} user 
   */
  enterRoom(user) {
    let userAlreadyInRoom =
      this.participants.filter((p) => p.userId === user.userId).length > 0;
    if (!userAlreadyInRoom) {
      this.participants.push(user);
      // 채팅방 들어옴 메세지 추가
      this.chats.push(new Chat('enter', user, ''));
    }
  }

  /**
   * 채팅방에서 사용자 나갈 때 처리
   * @function leaveRoom
   * @param {User} user 
   */
  leaveRoom(user) {
    const prevNumParticipants = this.participants.length;
    // 현재 방 인스턴스의 participants에서 유저 제거
    this.participants = this.participants.filter(
      (p) => p.userId !== user.userId
    );
    // 채팅방 나감 메세지 추가
    if (prevNumParticipants !== this.participants.length) {
      this.chats.push(new Chat('leave', user, ''));
    }
  }

  /**
   * 채팅방으로 메세지 보낼 때
   * @param {User} user - 채팅 보낸 user
   * @param {string} content - 채팅 내용
   */
  sendChat(user, content) {
    this.chats.push(new Chat('chat', user, content));
  }

  getUnreadCount(userId) {
    const lastReadTime = this.lastReadTime.filter(lrt => lrt.userId === userId);
    if(lastReadTime.length > 0) {
      lastReadTime = lastReadTime[0];
    } else {
      // user를 못 찾았을 경우: 해당 유저가 한 번도 읽은 적이 없다는 뜻
      return this.chats.length;
    }

    let unreadCount = 0;
    for(let i=this.chats.length-1; i>=0; i++) {
      if(this.chats[i].sentTime > lastReadTime) {
        unreadCount++;
      } else {
        break;
      }
    }
    return unreadCount;
  }

  /**
   * 현재 Room 인스턴스 내 데이터를 stringify한 object
   * @typedef StringifiedRoom
   * @type {object}
   * @property {number} roomId
   * @property {string} roomName
   * @property {Array.StringifiedUser} participants
   * @property {}
   */

  /**
   * localStorage에 JSON으로 저장을 위해 현재 Room 인스턴스 내 데이터를 stringify하여 object로 반환
   * @returns {object} 현재 Room 인스턴스 내 데이터를 stringify한 object
   */
  getRoom() {
    return {
      roomId: this.roomId,
      roomName: this.roomName,
      participants: this.participants.map((user) => user.getUser()),
      chats: this.chats.map((chat) => chat.getChat()),
      lastReadTime: this.lastReadTime.map((lrt) => ({
        userId: lrt.userId,
        time: lrt.time.getTime(),
      })),
      connectedUsers: this.connectedUsers,
    };
  }

  /**
   * 인스턴스 deepcopy 메서드 구현. 동일한 데이터를 가지고 있는 새로운 인스턴스를 반환.
   * @returns {Room}
   */
  getCopy() {
    return new Room(
      this.roomName,
      this.participants.slice(),
      this.roomId,
      this.chats.slice(),
      this.lastReadTime.map((lrt) => ({ userId: lrt.userId, time: lrt.time })),
      this.connectedUsers.slice()
    );
  }
}

/**
 * 채팅 정보 저장용 클래스
 * @typedef Chat
 * @type {object}
 * @property {string} type
 * @property {User} user
 * @property {string} content
 * @property {number} chatId
 * @property {object} sentTime - Javascript Date object
 */
class Chat {
  constructor(type, user, content, chatId) {
    if (chatId) {
      this.chatId = chatId;
      this.sentTime = new Date(chatId);
    } else {
      const d = new Date();
      this.chatId = d.getTime(); // Number
      this.sentTime = d; // Date
    }
    this.type = type; // String 'enter' || 'leave' || 'chat'
    this.user = user; // User
    this.content = content; // String
  }

  /**
   * @typedef StringifiedChat
   * @type {object}
   * @property {string} type 
   * @property {User} user 
   * @property {string} content 
   * @property {number} sentTime Javascript Date object stringified using Date.getTime()
   */

  /**
   * @method getChat
   * @returns {StringifiedChat}
   */
  getChat() {
    return {
      type: this.type,
      user: this.user.userId,
      content: this.content,
      sentTime: this.sentTime.getTime(),
    };
  }
}

// const fs = require('fs');
// let rawdata = fs.readFileSync('rooms.json');
// let initialRooms = JSON.parse(rawdata);

const RoomsContext = React.createContext();

export function useRooms() {
  return useContext(RoomsContext);
}

// RoomsProvider must be children of ContactsProvider
export default function RoomsProvider({ children }) {
  /**
   * React state localRooms
   * @name localRooms
   * @type {Array.StringifiedRoom}
   */
  const [localRooms, setLocalRooms] = useLocalStorage('rooms', []);
  const { getUserById, userActivity, currentUser } = useContacts(); // Array Users, // Return Type User
  
  /**
   * localStorage에 저장된 Room 데이터를 불러와 Room object 인스턴스를 각각 생성하여 그 인스턴스들이 저장된 배열 반환
   * @function loadLocalRooms
   * @returns {Array.Room} 생성된 Room 들이 저장된 배열
   */
  const loadLocalRooms = () => {
    return localRooms.map(
      (room) =>
        new Room(
          room.roomName,
          room.participants.map((user) => getUserById(user.userId)),
          room.roomId,
          room.chats.map(
            (chat) =>
              new Chat(
                chat.type,
                getUserById(chat.user),
                chat.content,
                chat.sentTime
              )
          ),
          room.lastReadTime.map((lrt) => ({
            userId: lrt.userId,
            time: new Date(lrt.time),
          })),
          room.connectedUsers.slice()
        )
    );
  };
  // 전체 방 리스트.
  /**
   * React state rooms. 모든 Room 저장된 state
   * @name rooms
   * @type {Array.Room}
   */
  const [rooms, setRooms] = useState(() => loadLocalRooms()); // Array Rooms

  // 현재 사용자(currentUser)가 입장해 있는 방만. ChatRoomList에서 본인이 입장해 있는 방만 렌더링하는데 사용
  /**
   * React state currentUserRooms. rooms 배열에 저장된 Room들 중 currentUser가 입장해 있는 방만 필터링한 배열
   * @name currentUserRooms
   * @type {Array.Room}
   */
  const [currentUserRooms, setCurrentUserRooms] = useState(() => {
    if (rooms !== null && rooms.length > 0) {
      if (currentUser !== null) {
        return rooms.filter((room) => room.isUserInRoom(currentUser.userId));
      } else {
        return rooms;
      }
    } else {
      return rooms;
    }
  });

  /**
   * 사용자가 현재 접속해 있는 방
   * @name selectedRoom
   * @type {Room}
   */
  const [selectedRoom, setSelectedRoom] = useState(null);

  // rooms state가 변경되면 변경된 데이터를 localstorage에도 저장
  useEffect(() => {
    setLocalRooms(rooms.map((room) => room.getRoom()));
  }, [rooms, setLocalRooms]);

  // rooms 중 currentUser가 입장해 있는 방만 저장되어 있는 currentUserRooms를 rooms 또는 currentUser가 변경될 때마다 업데이트
  useEffect(() => {
    setCurrentUserRooms(() => {
      if (rooms !== null && rooms.length > 0) {
        if (currentUser !== null) {
          return rooms.filter((room) => room.isUserInRoom(currentUser.userId));
        } else {
          return rooms;
        }
      } else {
        return rooms;
      }
    });
  }, [rooms, currentUser]);

  /**
   * @function getRoomById
   * @param {number} roomId
   * @returns {Room|boolean} roomId가 주어진 값과 일치하는 Room object. 찾지 못한 경우 false.
   */
  const getRoomById = useCallback(
    (roomId) => {
      const filteredRoom = rooms.filter(
        (room) => room.roomId.toString() === roomId.toString()
      );
      if (filteredRoom.length <= 0) return false;
      return filteredRoom[0];
    },
    [rooms]
  );

  /**
   * selectedRoom 업데이트 함수. 현재 사용자가 접속해서 읽고 있는 방
   * @function selectRoom
   * @param roomId
   */
  const selectRoom = useCallback(
    (roomId) => {
      setSelectedRoom(getRoomById(roomId));
      userActivity(currentUser.userId);
    },
    [getRoomById, userActivity, currentUser]
  );

  /**
   * selectedRoom을 지우는 함수. 현재 사용자가 읽고 있던 방에서 나와서 아무 방에도 들어가 있지 않은 상태
   * @function deselectRoom
   */
  const deselectRoom = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  /**
   * 사용자가 방에 접속해서 채팅을 읽으면 마지막으로 읽은 시간을 기록
   * @function readRoom
   * @param {string} userId 
   * @param {number} roomId 
   */
  const readRoom = (userId, roomId) => {
    const room = getRoomById(roomId);
    const exists =
      room.lastReadTime.filter((item) => item.userId === userId).length > 0;

    // rooms 배열 안 Room 인스턴스의 속성 중 lastReadTime 배열 안 우리가 찾는 유저의 마지막 읽은 시간 업데이트
    setRooms((prevRooms) => {
      // 새로운 Rooms 배열을 return
      return prevRooms.map((room) => {
        // 우리가 찾던 방만
        if (room.roomId === roomId) {
          let newRoom = room.getCopy();
          if (exists) {
            // 이미 한번 접속해서 읽은 기록이 있는 사용자
            newRoom.lastReadTime = newRoom.lastReadTime.map((lrt) => {
              // 우리가 찾는 사용자만
              if (lrt.userId === userId) {
                // 마지막 읽은 시간 업데이트
                return { userId: lrt.userId, time: new Date() };
              } else {
                // 나머지 사용자들은 그대로
                return lrt;
              }
            });
          } else {
            // 처음 방 접속하여 처음 읽는 사용자 - 사용자 엔트리 새롭게 추가
            newRoom.lastReadTime = [
              ...newRoom.lastReadTime,
              { userId: userId, time: new Date() },
            ];
          }
          return newRoom;
        } else {
          // 나머지 방들은 그대로
          return room;
        }
      });
    });
  };

  /**
   * 채팅방에 유저 초대
   * @function enterRoom
   * @param {string} userId - 초대하려는 User
   * @param {number} roomId - 대상 Room
   */
  const enterRoom = (userId, roomId) => {
    const user = getUserById(userId);

    setRooms((prevRooms) => {
      return prevRooms.map((room) => {
        if (room.roomId === roomId) {
          // let newRoom = room.getCopy();
          // newRoom.enterRoom(user);
          // return newRoom;
          room.enterRoom(user);
          return room;
        } else {
          return room;
        }
      });
    });
  };

  /**
   * 채팅방에서 사용자가 나감
   * @function leaveRoom
   * @param {string} userId -방에서 나가려는 User
   * @param {number} roomId - 대상 Room
   */
  const leaveRoom = (userId, roomId) => {
    const room = getRoomById(roomId);
    if (room.participants.length <= 1) {
      // delete room when last participant leaves
      setRooms((prevRooms) =>
        prevRooms.filter((room) => room.roomId !== roomId)
      );
    } else {
      // remove user from room
      const user = getUserById(userId);

      setRooms((prevRooms) => {
        return prevRooms.map((room) => {
          if (room.roomId === roomId) {
            room.leaveRoom(user);
            return room;
          } else {
            return room;
          }
        });
      });
    }
    userActivity(currentUser.userId);
  };

  /**
   * 채팅방으로 채팅 전송
   * @function sendMessage
   * @param {string} userId - 채팅을 보내는 User
   * @param {number} roomId - 대상 Room
   * @param {string} msg - 채팅 내용
   */
  const sendMessage = (userId, roomId, msg) => {
    // TODO Connect to server and add chat object to specified room
    setRooms((prevRooms) => {
      return prevRooms.map((room) => {
        if (room.roomId === roomId) {
          const user = getUserById(userId);
          room.sendChat(user, msg);
          return room;
        } else {
          return room;
        }
      });
    });
  };

  /**
   * 새로운 방 만들기
   * @function createRoom
   * @param {string} roomName - 새로 만드는 방 이름
   * @param {Array.string} participantUserIds - [userId]
   * @returns {?number} 새로 생성된 방의 roomId. 방 생성 실패시 null
   */
  const createRoom = (roomName, participantUserIds) => {
    let createRoomFail = false;
    let notFoundUserIds = [];
    const participants = participantUserIds.map((userId) => {
      const usr = getUserById(userId);
      if (!usr) {
        createRoomFail = true;
        notFoundUserIds.push(userId);
      }
      return usr;
    });
    if (createRoomFail) {
      let err_msg = '초대하려는 사용자를 찾을 수 없습니다. (';
      for (let i = 0; i < notFoundUserIds.length; i++) {
        err_msg += notFoundUserIds[i];
      }
      err_msg += ')';
      alert(err_msg);
      return null;
    } else {
      let newRoom = new Room(roomName, participants);
      setRooms((prevRooms) => [...prevRooms, newRoom]);
      return newRoom.roomId;
    }
  };

  /**
   * Settings에서 모든 데이터 초기화시 모든 채팅방, 채팅 내용 삭제
   * @function initializeLocalRooms
   */
  const initializeLocalRooms = () => {
    setRooms([]);
  };

  const value = {
    rooms,
    currentUserRooms,
    getRoomById,
    sendMessage,
    createRoom,
    selectedRoom,
    selectRoom,
    deselectRoom,
    readRoom,
    enterRoom,
    leaveRoom,
    initializeLocalRooms,
  };

  return (
    <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
  );
}
