import React, { useCallback, useContext, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

/**
 * class User - 사용자 Data Model
 * @namespace
 * @typedef User
 * @class 
 * @type {object}
 * @property {string} userId - 고유 사용자 ID. 사용자가 회원가입시 설정하며, 로그인시 사용. 프로그램 내에서 UNIQUE PRIMARY KEY로 사용
 * @property {string} userName - 사용자 이름
 * @property {string} statusMsg - 상태 메세지
 * @property {object} lastActive - Javascript Date object. 마지막 활동 시각
 */
class User {
  constructor(
    userId,
    userName,
    statusMsg = '',
    lastActive
  ) {
    this.userId = userId; //String
    this.userName = userName; //String
    if (lastActive) {
      this.lastActive = lastActive; //Date
    } else {
      this.lastActive = new Date(); //Date
    }
    this.statusMsg = statusMsg; //String
  }

  /**
   * 친구목록 등의 프로필 사진에서 현재 활동 중 표시부 색상(녹색/회색) 결정을 위해 사용
   * @method getCurrentlyActive()
   * @returns {boolean} currentlyActive - 사용자가 activeThreshold에서 설정한 시간 내에 활동이력이 있다면 true, 그렇지 않다면 false
   */
  getCurrentlyActive() {
    const SECOND = 1000;
    const MINUTE = SECOND * 60;
    const activeThreshold = MINUTE * 5;

    const now = new Date();
    const timeDifference = now - this.lastActive;

    if (timeDifference < activeThreshold) {
      //green
      return true;
    } else {
      //gray
      return false;
    }
  }

  /**
   * 현재 시각 기준 마지막으로 활동한 시각을 상대적으로 표시할 때 사용
   * @method getLastActiveString()
   * @returns {string} lastActiveString 현재 시각 기준 마지막으로 활동한 시각을 상대적으로 표현한 string 리턴.
   */
  getLastActiveString() {
    let str = '';
    const SECOND = 1000;
    const MINUTE = SECOND * 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const WEEK = DAY * 7;
    const MONTH = DAY * 30;
    const YEAR = DAY * 365;

    const now = new Date();

    const timeDifference = now - this.lastActive;
    if (timeDifference < SECOND) {
      str = '지금 활동 중';
    } else if (SECOND <= timeDifference && timeDifference < MINUTE) {
      str = Math.floor(timeDifference / SECOND).toString() + '초 전';
    } else if (MINUTE <= timeDifference && timeDifference < HOUR) {
      str = Math.floor(timeDifference / MINUTE).toString() + '분 전';
    } else if (HOUR <= timeDifference && timeDifference < DAY) {
      str = Math.floor(timeDifference / HOUR).toString() + '시간 전';
    } else if (DAY <= timeDifference && timeDifference < WEEK) {
      str = Math.floor(timeDifference / DAY).toString() + '일 전';
    } else if (WEEK <= timeDifference && timeDifference < MONTH) {
      str = Math.floor(timeDifference / WEEK).toString() + '주 전';
    } else if (MONTH <= timeDifference && timeDifference < YEAR) {
      str = Math.floor(timeDifference / MONTH).toString() + '개월 전';
    } else if (YEAR < timeDifference) {
      str = Math.floor(timeDifference / YEAR).toString() + '년 전';
    } else {
      str = Math.floor(timeDifference.toString() / 1000) + '초 전';
    }
    return str;
  }

  /** 
   * @typedef StringifiedUser
   * @type {object}
   * @property {string} userId
   * @property {string} userName
   * @property {number} lastActive - Date object stringfied using Date.getTime()
   * @property {string} statusMsg
   */

  /**
   * JSON 저장을 위해 클래스 데이터를 stringify하여 object 형태로 return
   * @method getUser
   * @returns {StringifiedUser}
   */
  getUser() {
    return {
      userId: this.userId,
      userName: this.userName,
      lastActive: this.lastActive.getTime(),
      statusMsg: this.statusMsg,
    };
  }

  /**
   * 동일한 데이터를 가지는 새로운 인스턴스를 생성
   * @method getCopy
   * @returns {User}
   */
  getCopy() {
    return new User(
      this.userId,
      this.userName,
      this.statusMsg,
      this.lastActive
    );
  }
}

const ContactsContext = React.createContext();

/**
 * React Custom Hook. ContactsContext 사용
 * @function useContacts
 * @returns {*} ContactsContext에 대한 useContext Hook 리턴
 */
export function useContacts() {
  return useContext(ContactsContext);
}

export default function ContactsProvider({ children }) {
  const [localUsers, setLocalUsers] = useLocalStorage('users', []);
  /**
   * localStorage에 JSON 형태로 저장되어 있는 사용자 계정 정보들을 불러와 각각의 사용자에 대한 User Object를 생성
   * @function loadLocalUsers
   * @returns 생성된 User Object들의 배열
   */
  const loadLocalUsers = () => {
    return localUsers.map(
      (user) =>
        new User(
          user.userId,
          user.userName,
          user.statusMsg,
          new Date(user.lastActive)
        )
    );
  };

  /**
   * React State users. 모든 사용자들을 저장하고 있는 User object 배열
   * @name users
   * @type {Array.User}
   */
  const [users, setUsers] = useState(() => {
    // (재방문) localStorage에 저장된 데이터가 있는 경우 불러오기
    const loadedLocalUsers = loadLocalUsers();
    if (loadedLocalUsers.length > 0) return loadedLocalUsers;

    // (최초 방문) localStorage가 비어있을 경우 기본 유저 자동 추가
    const initialUsers = [];
    initialUsers.push(new User('sean', '김영우', '미션 수행 중'));
    initialUsers.push(new User('ceos.fe', '프론트', '밤 새는 중'));
    initialUsers.push(
      new User('ceos.sinchon', '세오스', '우리 동아리 안힘들어요^^')
    );
    initialUsers.push(new User('test', '테스트', '시험용'));
    return initialUsers;
  });

  /**
   * users state가 변경 시 변경된 데이터를 localStorage에 저장
   */
  useEffect(() => {
    setLocalUsers(users.map((user) => user.getUser()));
  }, [users, setLocalUsers]);

  /**
   * 주어진 ID를 가진 User object를 users 배열에서 찾아서 반환
   * @function getUserById
   * @param {string} userId
   * @returns {(User|boolean)} id가 userId인 User object를 return. 찾지 못한 경우 false.
   */
  const getUserById = useCallback(
    (userId) => {
      const filteredUsers = users.filter((user) => user.userId === userId);
      if (filteredUsers.length > 0) {
        return filteredUsers[0];
      } else {
        return false;
      }
    },
    [users]
  );

  /**
   * React State currentUser - 현재 로그인한 사용자
   * @name currentUser
   * @type {User}
   */
  const [currentUser, setCurrentUser] = useState(() => getUserById('sean'));

  /**
   * 사용자가 활동을 하면 해당 User Object의 마지막 활동 시각을 업데이트하는 함수
   * @function userActivity
   * @param {string} userId
   */
  const userActivity = useCallback((userId) => {
    setUsers((prevUsers) => {
      return prevUsers.map((user) => {
        if (user.userId === userId) {
          return new User(
            user.userId,
            user.userName,
            user.statusMsg,
            new Date()
          );
        } else {
          return user;
        }
      });
    });
  }, []);

  /**
   * 현재 로그인한 사용자 변경
   * @function selectUser
   * @param {string} userId
   */
  const selectUser = useCallback(
    (userId) => {
      setCurrentUser(getUserById(userId));
      userActivity(userId);
    },
    [getUserById, userActivity]
  );

  /**
   * 현재 선택된 사용자 제거. 즉 로그아웃
   * @function deselectUser
   */
  const deselectUser = useCallback(() => {
    setCurrentUser(null);
  }, []);

  /**
   * 회원가입. 새로운 User object를 생성하여 users 배열에 push
   * @function createAccount
   */
  const createAccount = useCallback(
    (userId, userName, statusMsg) => {
      if (userId === '' || userName === '') return false;

      let userAlreadyExists = false;
      for (let i = 0; i < users.length; i++) {
        if (users[i].userId === userId) {
          userAlreadyExists = true;
          break;
        }
      }
      if (userAlreadyExists) return false;
      const newUser = new User(userId, userName, statusMsg);
      setUsers((prevUsers) => [...prevUsers, newUser]);
      setCurrentUser(newUser);
      return true;
    },
    [users]
  );

  /**
   * 사용자 정보에서 userId를 변경
   * @function changeUserId
   * @param {string} userId - 변경 전 userId
   * @param {string} newUserId - 변경 후 userId
   */
  const changeUserId = (userId, newUserId) => {
    setUsers((prevUsers) => {
      return prevUsers.map((user) => {
        if (user.userId === userId) {
          user.userId = newUserId;
          setCurrentUser(user);
          return user;
        } else {
          return user;
        }
      });
    });
  };

  /**
   * 사용자 정보에서 사용자 이름을 변경
   * @param {string} userId - 변경 대상 User의 userId
   * @param {string} newUserName - 변경 후 userName
   */
  const changeUserName = (userId, newUserName) => {
    setUsers((prevUsers) => {
      return prevUsers.map((user) => {
        if (user.userId === userId) {
          user.userName = newUserName;
          setCurrentUser(user);
          return user;
        } else {
          return user;
        }
      });
    });
  };

  /**
   * 사용자 정보에서 상태메세지를 변경
   * @param {string} userId - 변경 대상 User의 userId
   * @param {string} newStatusMsg - 변경 후 상태메세지
   */
  const changeStatusMsg = (userId, newStatusMsg) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.userId === userId) {
          user.statusMsg = newStatusMsg;
          setCurrentUser(user);
          return user;
        } else {
          return user;
        }
      })
    );
  };

  /**
   * 모든 데이터 초기화시 users 배열을 초기화하고 기본 데이터로 채우기
   * @function initializeLocalUsers
   */
  const initializeLocalUsers = () => {
    const initialUsers = [];
    initialUsers.push(new User('sean', '김영우', '미션 수행 중'));
    initialUsers.push(new User('ceos.fe', '프론트', '밤 새는 중'));
    initialUsers.push(
      new User('ceos.sinchon', '세오스', '우리 동아리 안힘들어요^^')
    );
    initialUsers.push(new User('test', '테스트', '시험용'));
    setUsers(initialUsers);
  };

  const value = {
    getUserById,
    users,
    setUsers,
    createAccount,
    currentUser,
    selectUser,
    deselectUser,
    userActivity,
    changeUserId,
    changeUserName,
    changeStatusMsg,
    initializeLocalUsers,
  };

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}
