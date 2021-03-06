package com.linkedin.thirdeye.auth;

import java.security.Principal;
import java.util.HashSet;
import java.util.Set;


public class ThirdEyePrincipal implements Principal {
  String name; // 'username@domainName'
  Set<String> groups = new HashSet<>();
  String sessionKey;

  public String getSessionKey() {
    return sessionKey;
  }

  public void setSessionKey(String sessionKey) {
    this.sessionKey = sessionKey;
  }

  @Override
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Set<String> getGroups() {
    return groups;
  }

  public void setGroups(Set<String> groups) {
    this.groups = groups;
  }
}
